import { and, eq, isNull, TransactionDB } from "@app/api/db";
import { createOrUpdateItems } from "@app/api/db/dal/items";
import { createOrUpdateProfileItems } from "@app/api/db/dal/profileItems";
import { items, profileItems, profileLabels } from "@app/api/db/schema";
import { extractFromHtml } from "@app/api/lib/extract";
import { ExtractError } from "@app/api/lib/extract/types";
import { Instapaper, type OAuthToken } from "@app/api/lib/instapaper";
import {
  type InstapaperBookmark,
  InstapaperError,
} from "@app/api/lib/instapaper/types";
import { storage } from "@app/api/lib/storage";
import { StorageError } from "@app/api/lib/storage/types";
import { Logger } from "@app/api/utils/logger";
import {
  ImportInstapaperMetadataSchema,
  InstapaperProfileItemMetadataSchema,
  ItemSource,
  ItemState,
} from "@app/schemas/db";
import { COLOR_PALETTE } from "@app/utils/colors";

import { Job } from ".";
import type { Env } from "./env";
import { Importer } from "./importer";

const BATCH_SIZE = 50;

export class InstapaperImporter extends Importer {
  private readonly instapaper: Instapaper;
  private readonly token: OAuthToken;

  constructor(job: Job, db: TransactionDB, env: Env, log: Logger) {
    super(job, db, env, log);
    this.instapaper = new Instapaper(env);
    const { data: metadata, error } = ImportInstapaperMetadataSchema.safeParse(
      job.metadata,
    );
    if (error) {
      throw new Error(`Invalid metadata in job ${job.id}: ${error.message}`);
    }
    const { oauth_token, oauth_token_secret } = metadata.accessToken;
    this.token = { key: oauth_token, secret: oauth_token_secret };
  }

  public async fetchMetadata(): Promise<number | null> {
    let have: Set<string> = new Set();
    let tags = new Set<string>();
    let fetchedBookmarks: number = 0;
    const BATCH_SIZE = 500;
    let lastBatchSize = 0;
    const startTime = new Date();

    try {
      const folders = {
        unread: ItemState.ACTIVE,
        archive: ItemState.ARCHIVED,
      };
      await Promise.all(
        Object.entries(folders).map(async ([folder, state]) => {
          do {
            const bookmarks: InstapaperBookmark[] = Array.from(
              new Map(
                (
                  await this.instapaper.listBookmarks(
                    this.token,
                    BATCH_SIZE,
                    folder,
                    Array.from(have).join(","),
                  )
                ).map((b) => [b.bookmark_id, b]),
              ).values(),
            );

            lastBatchSize = bookmarks.length;
            if (lastBatchSize === 0) {
              break;
            }

            have = new Set([
              ...have,
              ...bookmarks.map((b) => b.bookmark_id.toString()),
            ]);

            const newLabels = Array.from(
              new Set(
                bookmarks
                  .map((b) => b.tags.map((t) => t.name))
                  .flat()
                  .filter((name) => name !== ""),
              ),
            )
              .filter((name) => !tags.has(name))
              .map((name) => ({
                profileId: this.job.profileId,
                name,
                color:
                  COLOR_PALETTE[
                    Math.floor(Math.random() * COLOR_PALETTE.length)
                  ],
              }));

            await this.db.transaction(async (tx) => {
              const insertedItems = await createOrUpdateItems(
                tx,
                bookmarks.map((b) => b.url),
              );
              let insertedLabels: { id: string; name: string }[] = [];
              if (newLabels.length > 0) {
                insertedLabels = await tx
                  .insert(profileLabels)
                  .values(newLabels)
                  .onConflictDoUpdate({
                    target: [profileLabels.name, profileLabels.profileId],
                    set: { name: profileLabels.name },
                  })
                  .returning({
                    id: profileLabels.id,
                    name: profileLabels.name,
                  });
                tags = new Set([...tags, ...insertedLabels.map((l) => l.name)]);
              }
              const newProfileItems = bookmarks.map((b, index) => ({
                url: b.url,
                metadata: {
                  title: b.title,
                  description: b.description || null,
                  source: ItemSource.INSTAPAPER,
                  sourceMetadata: InstapaperProfileItemMetadataSchema.parse({
                    bookmarkId: b.bookmark_id,
                  }),
                  isFavorite: b.starred === "1",
                  readingProgress: Math.round(b.progress * 100),
                  lastReadAt: b.progress_timestamp
                    ? new Date(b.progress_timestamp).toUTCString()
                    : null,
                  state,
                  stateUpdatedAt: new Date(
                    startTime.getTime() + index + fetchedBookmarks,
                  ).toISOString(),
                },
                labelIds: b.tags.map(
                  (t) => insertedLabels.find((l) => l.name === t.name)!.id,
                ),
              }));

              const insertedProfileItems = await createOrUpdateProfileItems(
                tx,
                this.job.profileId,
                insertedItems,
                newProfileItems,
              );
              const newUnsavedItems = insertedProfileItems.filter(
                (item) => !item.savedAt,
              );
              fetchedBookmarks += newUnsavedItems.length;
            });
            this.log.info(`Successfully fetched bookmarks for folder`, {
              jobId: this.job.id,
              folder,
              bookmarks: bookmarks.length,
            });
          } while (lastBatchSize === BATCH_SIZE);
        }),
      );
      return fetchedBookmarks;
    } catch (error) {
      this.log.error("Error during Instapaper bookmark fetch loop", {
        error,
        jobId: this.job.id,
      });
      throw error;
    }
  }

  public async fetchItems(): Promise<number | null> {
    try {
      const nextItems = await this.db
        .select({
          id: profileItems.id,
          sourceMetadata: profileItems.sourceMetadata,
          url: items.url,
          slug: items.slug,
          metadata: {
            title: profileItems.title,
            description: profileItems.description,
            author: profileItems.author,
            publishedAt: profileItems.publishedAt,
            thumbnail: profileItems.thumbnail,
            favicon: profileItems.favicon,
            textDirection: profileItems.textDirection,
            textLanguage: profileItems.textLanguage,
          },
        })
        .from(profileItems)
        .innerJoin(items, eq(profileItems.itemId, items.id))
        .where(
          and(
            eq(profileItems.profileId, this.job.profileId),
            eq(profileItems.source, ItemSource.INSTAPAPER),
            isNull(profileItems.savedAt),
          ),
        )
        .limit(BATCH_SIZE);
      if (nextItems.length === 0) {
        return null;
      }
      this.log.info("Collected items to fetch", {
        jobId: this.job.id,
        items: nextItems.length,
      });
      for (const item of nextItems) {
        const { bookmarkId } = InstapaperProfileItemMetadataSchema.parse(
          item.sourceMetadata,
        );
        let htmlContent: string | null = null;
        try {
          htmlContent = await this.instapaper.getBookmarkText(
            this.token,
            bookmarkId,
          );
        } catch (error) {
          if (error instanceof InstapaperError) {
            this.log.warn("Failed to fetch Instapaper bookmark content", {
              jobId: this.job.id,
              profileItemId: item.id,
              error,
            });
          } else {
            throw error;
          }
        }
        if (htmlContent) {
          try {
            const { content } = await extractFromHtml(item.url, htmlContent);
            await storage.uploadItemContent(
              this.env,
              item.slug,
              content,
              item.metadata,
            );
          } catch (error) {
            if (error instanceof ExtractError) {
              this.log.warn("Failed to extract content from HTML", {
                jobId: this.job.id,
                profileItemId: item.id,
                error: error.message,
              });
            } else if (error instanceof StorageError) {
              this.log.warn("Failed to upload item content", {
                jobId: this.job.id,
                profileItemId: item.id,
                error: error.message,
              });
            } else {
              this.log.warn("Failed to save Instapaper bookmark content", {
                jobId: this.job.id,
                profileItemId: item.id,
                error,
              });
            }
          }
        }
        await this.db
          .update(profileItems)
          .set({
            savedAt: new Date(),
          })
          .where(eq(profileItems.id, item.id));
      }
      return nextItems.length;
    } catch (error) {
      this.log.error("Error during Instapaper item fetch", {
        error,
        jobId: this.job.id,
      });
      throw error;
    }
  }
}
