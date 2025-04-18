import { eq, getDb } from "@app/api/db";
import { jobs } from "@app/api/db/schema";
import { createLogger } from "@app/api/utils/logger";
import { ImportMetadataSchema, JobStatus, JobType } from "@app/schemas/db";
import type { MessageBatch } from "@cloudflare/workers-types";

import { type Env } from "./env";
import { InstapaperImporter } from "./instapaperImporter";

export type Job = typeof jobs.$inferSelect;

export interface QueueMessage {
  jobId: string;
}

export const itemsFetcherQueue = async (
  batch: MessageBatch<QueueMessage>,
  env: Env,
): Promise<void> => {
  const log = createLogger(env, "info", { worker: "items-fetcher" });
  log.info(`Consumer received ${batch.messages.length} messages.`);

  const db = getDb(env);

  for (const message of batch.messages) {
    const jobId = message.body.jobId;
    log.info(`Processing job ID: ${jobId}`);

    let job: Job | undefined;
    try {
      // Fetch job details
      job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
      });

      if (!job) {
        log.error(
          `Job ${jobId} not found in the database. Acknowledging message.`,
        );
        message.ack();
        continue;
      }

      log.debug("Job details fetched", { job });

      // Check if job is already processed
      if (
        [JobStatus.COMPLETED, JobStatus.FAILED].includes(
          job.status as JobStatus,
        )
      ) {
        log.warn(
          `Job ${jobId} already processed with status: ${job.status}. Skipping.`,
        );
        message.ack();
        continue;
      }

      await db
        .update(jobs)
        .set({
          status: JobStatus.RUNNING,
          startedAt: new Date(),
          errorMessage: null,
        })
        .where(eq(jobs.id, jobId));
      log.info(`Job ${jobId} status updated to RUNNING.`);

      // Route to the appropriate handler based on job type
      switch (job.type) {
        case JobType.IMPORT_INSTAPAPER:
          const instapaperImporter = new InstapaperImporter(job, db, env, log);
          await instapaperImporter.handleImport();
          break;
        default:
          throw new Error(`Unsupported job type: ${job.type} for job ${jobId}`);
      }

      const updatedJob = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
      });
      const finalMetadata = ImportMetadataSchema.parse(updatedJob?.metadata);

      await db
        .update(jobs)
        .set({
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          errorMessage: null,
          metadata: finalMetadata,
        })
        .where(eq(jobs.id, jobId));
      log.info(`Job ${jobId} completed successfully.`);

      message.ack();
    } catch (error) {
      log.error(`Error processing job`, { jobId, error });
      if (job) {
        // Ensure job was fetched before error
        try {
          const updatedJob = await db.query.jobs.findFirst({
            where: eq(jobs.id, jobId),
          });
          const finalMetadata = ImportMetadataSchema.parse(
            updatedJob?.metadata,
          );

          await db
            .update(jobs)
            .set({
              status: JobStatus.FAILED,
              completedAt: new Date(),
              errorMessage:
                error instanceof Error ? error.message : String(error),
              metadata: finalMetadata,
            })
            .where(eq(jobs.id, jobId));
          log.info(`Job status updated to FAILED.`, { jobId });
        } catch (dbError) {
          log.error(`Failed to update job status to FAILED`, {
            jobId,
            error: dbError,
          });
        }
      }
      message.retry();
      // Optional: Implement custom retry logic or dead-letter queue handling
    }
  }
  log.info("Finished processing batch.");
};

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    await itemsFetcherQueue(batch, env);
  },
};
