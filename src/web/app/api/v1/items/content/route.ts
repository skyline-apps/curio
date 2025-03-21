import { and, db, eq } from "@/db";
import { items, profileItems } from "@/db/schema";
import { extractMainContentAsMarkdown, extractMetadata } from "@/lib/extract";
import {
  ExtractedMetadata,
  ExtractError,
  MetadataError,
} from "@/lib/extract/types";
import { indexItemDocuments } from "@/lib/search";
import { storage } from "@/lib/storage";
import { StorageError, UploadStatus } from "@/lib/storage/types";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";
import { cleanUrl, generateSlug } from "@/utils/url";

import { updateProfileItem } from "./updateProfileItem";
import {
  UpdateItemContentRequestSchema,
  UpdateItemContentResponse,
  UpdateItemContentResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/content");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateItemContentResponse>> {
  const userId = request.headers.get("x-user-id");
  const profileResult = await checkUserProfile(userId);
  if ("error" in profileResult) {
    return profileResult.error as APIResponse<UpdateItemContentResponse>;
  }

  const body = await request.json();
  const data = await parseAPIRequest(UpdateItemContentRequestSchema, body);
  if ("error" in data) {
    return data.error;
  }

  const { url, htmlContent, skipMetadataExtraction } = data;

  if (!url || !htmlContent) {
    return APIResponseJSON(
      { error: "URL and HTML content are required." },
      { status: 400 },
    );
  }

  try {
    const cleanedUrl = cleanUrl(url);
    let slug: string = generateSlug(cleanedUrl);
    let metadata: ExtractedMetadata;
    const newDate = new Date();

    return await db.transaction(async (tx) => {
      const item = await tx
        .insert(items)
        .values({
          slug,
          url: cleanedUrl,
        })
        .onConflictDoUpdate({
          target: [items.url],
          set: {
            updatedAt: newDate,
          },
        })
        .returning({ id: items.id, slug: items.slug, url: items.url });
      slug = item[0].slug;

      if (skipMetadataExtraction) {
        const itemMetadata = await tx
          .select({
            title: profileItems.title,
            description: profileItems.description,
            author: profileItems.author,
            thumbnail: profileItems.thumbnail,
            favicon: profileItems.favicon,
            publishedAt: profileItems.publishedAt,
            textDirection: profileItems.textDirection,
            textLanguage: profileItems.textLanguage,
          })
          .from(profileItems)
          .where(
            and(
              eq(profileItems.itemId, item[0].id),
              eq(profileItems.profileId, profileResult.profile.id),
            ),
          )
          .limit(1);
        if (!itemMetadata.length) {
          return APIResponseJSON(
            { error: "Item not found and metadata not provided." },
            { status: 404 },
          );
        } else {
          metadata = itemMetadata[0];
        }
      } else {
        metadata = await extractMetadata(cleanedUrl, htmlContent);
      }

      const { content } = await extractMainContentAsMarkdown(
        cleanedUrl,
        htmlContent,
      );
      const { versionName, status } = await storage.uploadItemContent(
        slug,
        content,
        metadata,
      );

      const response: UpdateItemContentResponse =
        UpdateItemContentResponseSchema.parse({
          status,
          slug: slug,
          message:
            status === UploadStatus.UPDATED_MAIN
              ? "Content updated and set as main version"
              : status === UploadStatus.SKIPPED
                ? "Content already exists"
                : "Content updated",
        });

      if (status === UploadStatus.UPDATED_MAIN) {
        await tx
          .update(items)
          .set({ updatedAt: newDate })
          .where(eq(items.id, item[0].id));

        await updateProfileItem(
          tx,
          item[0].url,
          profileResult.profile.id,
          item[0].id,
          metadata,
          newDate,
        );

        // Index profile item with new main content
        await indexItemDocuments([
          {
            slug: slug,
            url: item[0].url,
            title: metadata.title || item[0].url,
            description: metadata.description ?? undefined,
            author: metadata.author ?? undefined,
            content: content,
            contentVersionName: versionName,
          },
        ]);
        return APIResponseJSON(response);
      } else if (
        status === UploadStatus.STORED_VERSION ||
        status === UploadStatus.SKIPPED
      ) {
        const defaultMetadata = await storage.getItemMetadata(slug);
        const newMetadata = { ...metadata };
        Object.entries(defaultMetadata).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            newMetadata[key as keyof ExtractedMetadata] = value;
          }
        });
        // Update item metadata and clear reading state
        await updateProfileItem(
          tx,
          item[0].url,
          profileResult.profile.id,
          item[0].id,
          newMetadata,
          newDate,
        );
        return APIResponseJSON(response);
      } else {
        log.error("Upload error", { status: status });
        return APIResponseJSON(
          { error: "Error uploading item content." },
          { status: 500 },
        );
      }
    });
  } catch (error: unknown) {
    if (error instanceof StorageError) {
      return APIResponseJSON({ error: error.message }, { status: 500 });
    } else if (error instanceof ExtractError) {
      log.error(`Error extracting content for ${url}:`, error.message);
      return APIResponseJSON({ error: error.message }, { status: 500 });
    } else if (error instanceof MetadataError) {
      log.error(`Error extracting metadata for ${url}:`, error.message);
      return APIResponseJSON({ error: error.message }, { status: 500 });
    } else if (error instanceof Error) {
      log.error(
        `Error updating item content for ${url}:`,
        error.name,
        error.message.substring(0, 200),
        error.stack,
      );
      return APIResponseJSON(
        { error: "Error updating item content." },
        { status: 500 },
      );
    } else {
      log.error(`Unknown error updating item content for ${url}:`, error);
      return APIResponseJSON(
        { error: "Unknown error updating item content." },
        { status: 500 },
      );
    }
  }
}
