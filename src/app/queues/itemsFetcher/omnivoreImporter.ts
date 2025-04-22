import { and, eq, isNull, TransactionDB } from "@app/api/db";
import { createOrUpdateItems } from "@app/api/db/dal/items";
import { createOrUpdateProfileItems } from "@app/api/db/dal/profileItems";
import { items, profileItems, profileLabels } from "@app/api/db/schema";
import { extractFromHtml } from "@app/api/lib/extract";
import { ExtractError } from "@app/api/lib/extract/types";
import { storage } from "@app/api/lib/storage";
import { StorageError } from "@app/api/lib/storage/types";
import { Logger } from "@app/api/utils/logger";
import {
  ImportOmnivoreMetadataSchema,
  ItemSource,
  ItemState,
  OmnivoreProfileItemMetadataSchema,
} from "@app/schemas/db";
import { Unzipped, unzipSync } from "fflate";

import { Job } from ".";
import type { Env } from "./env";
import { Importer } from "./importer";

interface OmnivoreJsonItem {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  author: string;
  thumbnail: string | null;
  publishedAt: string | null;
  savedAt: string;
  updatedAt: string;
  state: string;
  labels: string[];
  readingProgress: number;
}

const BATCH_SIZE = 50;

export class OmnivoreImporter extends Importer {
  private readonly storageKey: string;
  private zipContents: Unzipped;

  constructor(job: Job, db: TransactionDB, env: Env, log: Logger) {
    super(job, db, env, log);
    const { data: metadata, error } = ImportOmnivoreMetadataSchema.safeParse(
      job.metadata,
    );
    if (error) {
      throw new Error(`Invalid metadata in job ${job.id}: ${error.message}`);
    }
    this.storageKey = metadata.storageKey;
    this.zipContents = {};
  }

  private async loadExport(): Promise<Unzipped> {
    if (Object.keys(this.zipContents).length > 0) {
      return this.zipContents;
    }
    const compressedFile = await storage.readImportFile(
      this.env,
      this.storageKey,
    );
    const fileData = new Uint8Array(
      await (compressedFile as Blob).arrayBuffer(),
    );
    try {
      this.zipContents = unzipSync(fileData);
      this.log.info("Successfully unzipped Omnivore archive in memory", {
        jobId: this.job.id,
      });
    } catch (unzipError) {
      this.log.error("Failed to unzip Omnivore archive", {
        error: unzipError,
        jobId: this.job.id,
      });
      throw unzipError;
    }
    return this.zipContents;
  }

  public async fetchMetadata(): Promise<number | null> {
    let fetchedItems: number = 0;
    let labels = new Set<string>();
    const startTime = new Date();

    try {
      const unzipped = await this.loadExport();
      const textDecoder = new TextDecoder();
      let itemOffset = 0;

      for (const filePath of Object.keys(unzipped)) {
        const fileName = filePath.split("/").pop() || filePath;
        const omnivoreItems: OmnivoreJsonItem[] = [];
        if (!(fileName.startsWith("metadata_") && fileName.endsWith(".json"))) {
          continue;
        }
        try {
          const fileContent = unzipped[filePath];
          const jsonString = textDecoder.decode(fileContent);
          const itemsInFile = JSON.parse(jsonString) as OmnivoreJsonItem[];
          omnivoreItems.push(...itemsInFile);
        } catch (jsonError) {
          this.log.error("Error processing metadata file in archive", {
            file: filePath,
            error: jsonError,
            jobId: this.job.id,
          });
        }
        if (omnivoreItems.length === 0) {
          this.log.warn("No items found in Omnivore metadata files.", {
            jobId: this.job.id,
          });
          continue;
        }

        const newLabels = this.generateLabelsToInsert(
          omnivoreItems.map((i) => i.labels || []).flat(),
        );

        await this.db.transaction(async (tx) => {
          const insertedItems = await createOrUpdateItems(
            tx,
            omnivoreItems.map((i) => i.url),
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
            labels = new Set([...labels, ...insertedLabels.map((l) => l.name)]);
          }
          const newProfileItems = omnivoreItems.map((i, index) => ({
            url: i.url,
            metadata: {
              title: i.title,
              description: i.description || null,
              author: i.author || null,
              thumbnail: i.thumbnail || null,
              source: ItemSource.OMNIVORE,
              sourceMetadata: OmnivoreProfileItemMetadataSchema.parse({
                omnivoreSlug: i.slug,
              }),
              isFavorite: i.labels?.includes("Favorite") || false,
              readingProgress: Math.floor(i.readingProgress) || 0,
              lastReadAt: i.readingProgress
                ? new Date(i.updatedAt).toUTCString()
                : null,
              state:
                i.state === "Archived" ? ItemState.ARCHIVED : ItemState.ACTIVE,
              stateUpdatedAt: new Date(
                startTime.getTime() + itemOffset + index,
              ).toISOString(),
            },
            labelIds: i.labels.map(
              (name) => insertedLabels.find((l) => l.name === name)!.id,
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
          fetchedItems += newUnsavedItems.length;
        });
        itemOffset += omnivoreItems.length;
      }
      this.log.info(`Successfully fetched items from Omnivore export`, {
        jobId: this.job.id,
        items: fetchedItems,
      });

      return fetchedItems;
    } catch (error) {
      this.log.error("Error during Omnivore metadata fetch loop", {
        error,
        jobId: this.job.id,
      });
      throw error;
    }
  }

  public async fetchItems(): Promise<number | null> {
    try {
      const unzipped = await this.loadExport();
      const textDecoder = new TextDecoder();

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
            eq(profileItems.source, ItemSource.OMNIVORE),
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
        const { omnivoreSlug } = OmnivoreProfileItemMetadataSchema.parse(
          item.sourceMetadata,
        );
        let htmlContent: string | null = null;
        try {
          htmlContent = textDecoder.decode(
            unzipped[`content/${omnivoreSlug}.html`],
          );
        } catch (error) {
          throw error;
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
              this.log.warn("Failed to save Omnivore bookmark content", {
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
      this.log.error("Error during Omnivore item fetch", {
        error,
        jobId: this.job.id,
      });
      throw error;
    }
  }
}
