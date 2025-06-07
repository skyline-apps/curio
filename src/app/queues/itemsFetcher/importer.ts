import { eq, TransactionDB } from "@app/api/db";
import { jobs, profileLabels } from "@app/api/db/schema";
import { Logger } from "@app/api/utils/logger";
import { ImportMetadata, ImportStatus } from "@app/schemas/db";
import { COLOR_PALETTE } from "@app/utils/colors";

import { Job } from ".";
import type { Env } from "./env";

type Label = Omit<
  typeof profileLabels.$inferSelect,
  "id" | "createdAt" | "updatedAt"
>;

export class Importer {
  protected job: Job;
  protected readonly db: TransactionDB;
  protected readonly env: Env;
  protected readonly log: Logger;

  constructor(job: Job, db: TransactionDB, env: Env, log: Logger) {
    this.job = job;
    this.db = db;
    this.env = env;
    this.log = log;
  }

  protected generateLabelsToInsert(labelNames: string[]): Label[] {
    const newLabels = Array.from(
      new Set(labelNames.filter((name) => name !== "")),
    ).map((name) => ({
      profileId: this.job.profileId,
      name,
      color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
    }));
    return newLabels;
  }

  public async fetchMetadata(): Promise<number | null> {
    return null;
  }

  public async fetchItems(): Promise<number | null> {
    return null;
  }

  public async handleImport(): Promise<void> {
    const originalMetadata = this.job.metadata as ImportMetadata;
    let totalItems, processedItems: number;
    if (originalMetadata.status === ImportStatus.NOT_STARTED) {
      totalItems = await this.fetchMetadata();
      if (totalItems === null) {
        this.log.error("Failed to import metadata", {
          jobId: this.job.id,
        });
        throw new Error("Failed to import metadata");
      }
      this.log.info(`Successfully imported items`, {
        jobId: this.job.id,
        totalItems,
      });
      await this.db
        .update(jobs)
        .set({
          metadata: {
            ...originalMetadata,
            status: ImportStatus.FETCHED_ITEMS,
            totalItems,
          },
        })
        .where(eq(jobs.id, this.job.id));
    } else {
      totalItems = originalMetadata.totalItems;
    }
    if (totalItems === null || totalItems === undefined) {
      throw new Error("No items to import");
    }
    processedItems = originalMetadata.processedItems || 0;
    while (processedItems < totalItems) {
      const items = await this.fetchItems();
      if (items === null) {
        return;
      }
      processedItems += items;
      await this.db
        .update(jobs)
        .set({
          metadata: {
            ...originalMetadata,
            status: ImportStatus.FETCHED_ITEMS,
            totalItems,
            processedItems,
          },
        })
        .where(eq(jobs.id, this.job.id));
    }
  }
}
