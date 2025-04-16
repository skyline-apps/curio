import { eq, TransactionDB } from "@app/api/db";
import { jobs } from "@app/api/db/schema";
import { Logger } from "@app/api/utils/logger";
import { ImportMetadata, ImportStatus } from "@app/schemas/db";

import { Job } from ".";
import type { Env } from "./env";

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

  public async fetchMetadata(): Promise<number | null> {
    return null;
  }

  public async handleImport(): Promise<void> {
    const metadata = this.job.metadata as ImportMetadata;
    if (metadata.status === ImportStatus.NOT_STARTED) {
      const numberOfItems = await this.fetchMetadata();
      if (numberOfItems === null) {
        this.log.error("Failed to import metadata");
        throw new Error("Failed to import metadata");
      }
      this.log.info(`Successfully imported items`, {
        jobId: this.job.id,
        numberOfItems,
      });
      await this.db
        .update(jobs)
        .set({
          metadata: {
            ...metadata,
            status: ImportStatus.FETCHED_ITEMS,
            numberOfItems,
          },
        })
        .where(eq(jobs.id, this.job.id));
    }
  }
}
