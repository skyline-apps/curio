import { and, eq } from "@app/api/db";
import { updateProfileItem } from "@app/api/db/dal/profileItems";
import { items, profileItems } from "@app/api/db/schema";
import { extractFromHtml } from "@app/api/lib/extract";
import { ExtractedMetadata, ExtractError } from "@app/api/lib/extract/types";
import { indexItemDocuments } from "@app/api/lib/search";
import { storage } from "@app/api/lib/storage";
import { StorageError } from "@app/api/lib/storage/types";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { cleanUrl, generateSlug } from "@app/api/utils/url";
import { UploadStatus } from "@app/schemas/types";
import {
  UpdateItemContentRequest,
  UpdateItemContentRequestSchema,
  UpdateItemContentResponse,
  UpdateItemContentResponseSchema,
} from "@app/schemas/v1/items/content";
import { Hono } from "hono";

export const itemsContentRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc(
      "post",
      UpdateItemContentRequestSchema,
      UpdateItemContentResponseSchema,
    ),
  ),
  zValidator(
    "json",
    UpdateItemContentRequestSchema,
    parseError<UpdateItemContentRequest, UpdateItemContentResponse>,
  ),
  async (c): Promise<APIResponse<UpdateItemContentResponse>> => {
    const { url, htmlContent, skipMetadataExtraction } = c.req.valid("json");
    const profileId = c.get("profileId")!;

    try {
      const cleanedUrl = cleanUrl(url);
      let slug: string = generateSlug(cleanedUrl);
      let metadata: ExtractedMetadata;
      const newDate = new Date();
      const db = c.get("db");

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

        const { content, metadata: extractedMetadata } = await extractFromHtml(
          cleanedUrl,
          htmlContent,
        );
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
                eq(profileItems.profileId, profileId),
              ),
            )
            .limit(1);
          if (!itemMetadata.length) {
            return c.json(
              { error: "Item not found and metadata not provided." },
              404,
            );
          } else {
            metadata = itemMetadata[0];
          }
        } else {
          metadata = extractedMetadata;
        }

        const { versionName, status } = await storage.uploadItemContent(
          c,
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
            profileId,
            item[0].id,
            metadata,
            newDate,
          );

          // Index profile item with new main content
          await indexItemDocuments(c, [
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
          return c.json(response);
        } else if (
          status === UploadStatus.STORED_VERSION ||
          status === UploadStatus.SKIPPED
        ) {
          const defaultMetadata = await storage.getItemMetadata(c, slug);
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
            profileId,
            item[0].id,
            newMetadata,
            newDate,
          );
          return c.json(response);
        } else {
          log("Upload error", { status: status });
          return c.json({ error: "Error uploading item content." }, 500);
        }
      });
    } catch (error: unknown) {
      if (error instanceof StorageError) {
        return c.json({ error: error.message }, 500);
      } else if (error instanceof ExtractError) {
        log(`Error extracting content for ${url}:`, error.message);
        return c.json({ error: error.message }, 500);
      } else if (error instanceof Error) {
        log(
          `Error updating item content for ${url}:`,
          error.name,
          error.message.substring(0, 200),
          error.stack,
        );
        return c.json({ error: "Error updating item content." }, 500);
      } else {
        log(`Unknown error updating item content for ${url}:`, error);
        return c.json({ error: "Unknown error updating item content." }, 500);
      }
    }
  },
);
