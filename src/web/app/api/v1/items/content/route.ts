import { and, db, eq, sql, type TransactionDB } from "@/db";
import { items, profileItemHighlights, profileItems } from "@/db/schema";
import { extractMainContentAsMarkdown, extractMetadata } from "@/lib/extract";
import {
  ExtractedMetadata,
  ExtractError,
  MetadataError,
} from "@/lib/extract/types";
import { indexDocuments } from "@/lib/search";
import { storage } from "@/lib/storage";
import { StorageError } from "@/lib/storage/types";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";
import { cleanUrl } from "@/utils/url";

import {
  UpdateItemContentRequestSchema,
  UpdateItemContentResponse,
  UpdateItemContentResponseSchema,
  UploadStatus,
} from "./validation";

const log = createLogger("api/v1/items/content");

async function updateProfileItem(
  tx: TransactionDB,
  itemUrl: string,
  profileId: string,
  itemId: string,
  metadata: ExtractedMetadata,
  savedAt: Date,
): Promise<string> {
  const newTitle = metadata.title || itemUrl;
  const profileItem = await tx
    .update(profileItems)
    .set({
      savedAt: savedAt,
      title: newTitle,
      author: metadata.author,
      description: metadata.description,
      thumbnail: metadata.thumbnail,
      favicon: metadata.favicon,
      publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
      readingProgress: 0,
      versionName: null,
    })
    .where(
      and(
        eq(profileItems.itemId, itemId),
        eq(profileItems.profileId, profileId),
      ),
    )
    .returning({
      id: profileItems.id,
    });

  if (!profileItem.length) {
    throw Error("Failed to save updated profile item information.");
  }
  // Delete previous highlights
  await tx
    .delete(profileItemHighlights)
    .where(
      eq(
        profileItemHighlights.profileItemId,
        sql`(SELECT id FROM ${profileItems} WHERE profile_id = ${profileId} AND id = ${profileItemHighlights.profileItemId} AND item_id = ${itemId})`,
      ),
    );

  return profileItem[0].id;
}

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

  try {
    const cleanedUrl = cleanUrl(url);

    return await db.transaction(async (tx) => {
      const item = await tx
        .select({
          id: items.id,
          slug: items.slug,
          url: items.url,
          metadata: {
            title: profileItems.title,
            description: profileItems.description,
            author: profileItems.author,
            thumbnail: profileItems.thumbnail,
            favicon: profileItems.favicon,
            publishedAt: profileItems.publishedAt,
          },
        })
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

      const slug = item[0].slug;

      const newDate = new Date();
      let metadata: ExtractedMetadata;
      if (skipMetadataExtraction) {
        metadata = {
          title: item[0].metadata.title,
          description: item[0].metadata.description,
          author: item[0].metadata.author,
          thumbnail: item[0].metadata.thumbnail,
          favicon: item[0].metadata.favicon,
          publishedAt: item[0].metadata.publishedAt,
        };
      } else {
        metadata = await extractMetadata(cleanedUrl, htmlContent);
      }
      const markdownContent = await extractMainContentAsMarkdown(
        cleanedUrl,
        htmlContent,
      );
      const { versionName, status } = await storage.uploadItemContent(
        slug,
        markdownContent,
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

        const profileItemId = await updateProfileItem(
          tx,
          item[0].url,
          profileResult.profile.id,
          item[0].id,
          metadata,
          newDate,
        );

        // Index profile item with new main content
        await indexDocuments([
          {
            profileItemId: profileItemId,
            profileId: profileResult.profile.id,
            content: markdownContent,
            contentVersionName: versionName,
            url: item[0].url,
            slug: slug,
          },
        ]);
        return APIResponseJSON(response);
      } else if (
        status === UploadStatus.STORED_VERSION ||
        status === UploadStatus.SKIPPED
      ) {
        const profileItem = await tx
          .select({
            versionName: profileItems.versionName,
            savedAt: profileItems.savedAt,
          })
          .from(profileItems)
          .where(
            and(
              eq(profileItems.itemId, item[0].id),
              eq(profileItems.profileId, profileResult.profile.id),
            ),
          )
          .limit(1);

        const defaultMetadata = await storage.getItemMetadata(slug);
        // If the metadata hasn't previously been stored, update it here.
        if (
          profileItem[0].savedAt === null &&
          profileItem[0].versionName === null
        ) {
          // No change to which version is being used, so no need to re-index
          await updateProfileItem(
            tx,
            item[0].url,
            profileResult.profile.id,
            item[0].id,
            defaultMetadata,
            newDate,
          );
        } else if (
          profileItem[0].versionName !== null &&
          profileItem[0].versionName !== defaultMetadata.timestamp
        ) {
          // The default content is longer, so update the item to use the default version and re-index
          const { content, versionName } = await storage.getItemContent(
            slug,
            null,
          );
          const profileItemId = await updateProfileItem(
            tx,
            item[0].url,
            profileResult.profile.id,
            item[0].id,
            defaultMetadata,
            newDate,
          );
          await indexDocuments([
            {
              profileItemId: profileItemId,
              profileId: profileResult.profile.id,
              content: content,
              contentVersionName: versionName,
              url: item[0].url,
              slug: slug,
            },
          ]);
        }
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
