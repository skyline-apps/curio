import { ItemResultSchema } from "@/app/api/v1/items/validation";
import { and, db, eq, sql } from "@/db";
import { items, profileItems } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import {
  ExtractedMetadata,
  ExtractError,
  extractMainContentAsMarkdown,
  extractMetadata,
  MetadataError,
} from "@/utils/extract";
import { createLogger } from "@/utils/logger";
import { storage, StorageError } from "@/utils/storage";
import { cleanUrl } from "@/utils/url";

import {
  GetItemContentRequestSchema,
  GetItemContentResponse,
  UpdateItemContentRequestSchema,
  UpdateItemContentResponse,
  UploadStatus,
} from "./validation";

const log = createLogger("api/v1/items/content");

export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetItemContentResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<GetItemContentResponse>;
    }

    const url = new URL(request.url);
    const data = await parseAPIRequest(
      GetItemContentRequestSchema,
      Object.fromEntries(url.searchParams),
    );
    if ("error" in data) {
      return data.error;
    }

    const { slug } = data;

    const item = await db
      .select({
        id: items.id,
        url: items.url,
        slug: items.slug,
        metadata: {
          title: profileItems.title,
          description: profileItems.description,
          author: profileItems.author,
          thumbnail: profileItems.thumbnail,
          publishedAt: profileItems.publishedAt,
          savedAt: profileItems.savedAt,
          state: profileItems.state,
          isFavorite: profileItems.isFavorite,
          readingProgress: profileItems.readingProgress,
          lastReadAt: profileItems.lastReadAt,
          versionName: profileItems.versionName,
        },
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(
        and(
          eq(items.slug, slug),
          eq(profileItems.profileId, profileResult.profile.id),
        ),
      )
      .limit(1);

    if (!item.length) {
      return APIResponseJSON({ error: "Item not found." }, { status: 404 });
    }

    const itemResponse = ItemResultSchema.parse(item[0]);

    try {
      const content = await storage.getItemContent(slug);
      const response: GetItemContentResponse = {
        content,
        item: itemResponse,
      };
      return APIResponseJSON(response);
    } catch (error: unknown) {
      if (error instanceof StorageError) {
        return APIResponseJSON({ item: itemResponse });
      } else {
        throw error;
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      log.error("Error getting item content:", error);
      return APIResponseJSON(
        { error: "Error getting item content." },
        { status: 500 },
      );
    } else {
      log.error("Unknown error getting item content:", error);
      return APIResponseJSON(
        { error: "Unknown error getting item content." },
        { status: 500 },
      );
    }
  }
}

async function updateMetadata(
  itemUrl: string,
  profileId: string,
  itemId: string,
  metadata: ExtractedMetadata,
  savedAt: Date,
): Promise<void> {
  const newTitle = metadata.title || itemUrl;
  await db
    .update(profileItems)
    .set({
      savedAt: savedAt,
      title: newTitle,
      author: metadata.author,
      description: metadata.description,
      thumbnail: metadata.thumbnail,
      publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
      versionName: null,
    })
    .where(
      and(
        eq(profileItems.itemId, itemId),
        eq(profileItems.profileId, profileId),
      ),
    );
}

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateItemContentResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdateItemContentResponse>;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdateItemContentRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { url, htmlContent } = data;

    const cleanedUrl = cleanUrl(url);

    const item = await db
      .select()
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(
        and(
          eq(items.url, cleanedUrl),
          eq(profileItems.profileId, profileResult.profile.id),
        ),
      )
      .limit(1);

    if (!item.length) {
      return APIResponseJSON({ error: "Item not found." }, { status: 404 });
    }

    const slug = item[0].items.slug;

    const newDate = new Date();
    const metadata = await extractMetadata(cleanedUrl, htmlContent);
    const markdownContent = await extractMainContentAsMarkdown(
      cleanedUrl,
      htmlContent,
    );
    const status = await storage.uploadItemContent(
      slug,
      markdownContent,
      metadata,
    );

    const response: UpdateItemContentResponse = {
      status,
      slug: item[0].items.slug,
      message:
        status === UploadStatus.UPDATED_MAIN
          ? "Content updated and set as main version"
          : status === UploadStatus.SKIPPED
            ? "Content already exists"
            : "Content updated",
    };

    if (status === UploadStatus.UPDATED_MAIN) {
      await db
        .update(items)
        .set({ updatedAt: newDate })
        .where(eq(items.id, item[0].items.id));

      await updateMetadata(
        item[0].items.url,
        profileResult.profile.id,
        item[0].items.id,
        metadata,
        newDate,
      );
      return APIResponseJSON(response);
    } else if (
      status === UploadStatus.STORED_VERSION ||
      status === UploadStatus.SKIPPED
    ) {
      const profileItem = await db
        .select()
        .from(profileItems)
        .where(
          and(
            eq(profileItems.itemId, item[0].items.id),
            eq(profileItems.profileId, profileResult.profile.id),
            sql`${profileItems.versionName} IS NULL`,
            sql`${profileItems.savedAt} IS NULL`,
          ),
        )
        .limit(1);

      // If the metadata hasn't previously been stored, update it here.
      if (profileItem.length > 0) {
        const defaultMetadata = await storage.getItemMetadata(slug);
        await updateMetadata(
          item[0].items.url,
          profileResult.profile.id,
          item[0].items.id,
          defaultMetadata,
          newDate,
        );
      }
      return APIResponseJSON(response);
    } else {
      log.error("Upload error", { status: status });
      return APIResponseJSON(
        { error: "Error uploading item content." },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    if (error instanceof StorageError) {
      return APIResponseJSON({ error: error.message }, { status: 500 });
    } else if (error instanceof ExtractError) {
      log.error("Error extracting content:", error.message);
      return APIResponseJSON({ error: error.message }, { status: 500 });
    } else if (error instanceof MetadataError) {
      log.error("Error extracting metadata:", error.message);
      return APIResponseJSON({ error: error.message }, { status: 500 });
    } else if (error instanceof Error) {
      log.error(
        "Error updating item content:",
        error.name,
        error.message.substring(0, 200),
        error.stack,
      );
      return APIResponseJSON(
        { error: "Error updating item content." },
        { status: 500 },
      );
    } else {
      log.error("Unknown error updating item content:", error);
      return APIResponseJSON(
        { error: "Unknown error updating item content." },
        { status: 500 },
      );
    }
  }
}
