import { TransactionDB } from "@app/api/db";
import { createOrUpdateItems } from "@app/api/db/dal/items";
import { createOrUpdateProfileItems } from "@app/api/db/dal/profileItems";
import { profileLabels } from "@app/api/db/schema";
import { Instapaper, type OAuthToken } from "@app/api/lib/instapaper";
import type { InstapaperBookmark } from "@app/api/lib/instapaper/types";
import { Logger } from "@app/api/utils/logger";
import { ImportInstapaperMetadataSchema, ItemSource } from "@app/schemas/db";
import { COLOR_PALETTE } from "@app/utils/colors";

import { Job } from ".";
import type { Env } from "./env";
import { Importer } from "./importer";

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
    const have: string[] = [];
    let tags = new Set<string>();
    let fetchedBookmarks: number = 0;
    const BATCH_SIZE = 500;
    let lastBatchSize = 0;

    try {
      do {
        const bookmarks: InstapaperBookmark[] =
          await this.instapaper.listBookmarks(
            this.token,
            BATCH_SIZE,
            "unread",
            have.join(","),
          );

        lastBatchSize = bookmarks.length;
        if (lastBatchSize === 0) {
          break;
        }

        fetchedBookmarks += lastBatchSize;

        have.push(...bookmarks.map((b) => b.bookmark_id.toString()));

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
              COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
          }));

        await this.db.transaction(async (tx) => {
          const insertedItems = await createOrUpdateItems(
            tx,
            bookmarks.map((b) => b.url),
          );
          const insertedLabels = await this.db
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
          const newProfileItems = bookmarks.map((b) => ({
            url: b.url,
            metadata: {
              title: b.title,
              description: b.description || null,
              source: ItemSource.INSTAPAPER,
              sourceMetadata: { bookmarkId: b.bookmark_id },
              isFavorite: b.starred === "1",
              readingProgress: Math.round(b.progress * 100),
              lastReadAt: b.progress_timestamp
                ? new Date(b.progress_timestamp).toUTCString()
                : null,
            },
            labelIds: b.tags.map(
              (t) => insertedLabels.find((l) => l.name === t.name)!.id,
            ),
          }));

          await createOrUpdateProfileItems(
            tx,
            this.job.profileId,
            insertedItems,
            newProfileItems,
          );
        });
      } while (lastBatchSize === BATCH_SIZE);

      this.log.info(
        `Successfully fetched ${fetchedBookmarks} bookmarks for job ${this.job.id}`,
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
}
