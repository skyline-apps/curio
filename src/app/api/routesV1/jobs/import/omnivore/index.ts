import { eq } from "@app/api/db";
import { getIncompleteJobs } from "@app/api/db/dal/jobs";
import { jobs } from "@app/api/db/schema";
import { storage } from "@app/api/lib/storage";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  ImportOmnivoreMetadataSchema,
  ImportStatus,
  JobStatus,
  JobType,
} from "@app/schemas/db";
import {
  ImportOmnivoreRequestSchema,
  ImportOmnivoreResponse,
  ImportOmnivoreResponseSchema,
} from "@app/schemas/v1/jobs/import/omnivore";
import { Hono } from "hono";

// eslint-disable-next-line @local/eslint-local-rules/api-validation
export const importOmnivoreRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", ImportOmnivoreRequestSchema, ImportOmnivoreResponseSchema),
  ),
  zValidator("form", ImportOmnivoreRequestSchema),
  async (c): Promise<APIResponse<ImportOmnivoreResponse>> => {
    const log = c.get("log");
    const profileId = c.get("profileId")!;
    const queue = c.env.ITEMS_FETCHER_QUEUE;
    const db = c.get("db");

    try {
      const existingJobs = await getIncompleteJobs(
        db,
        profileId,
        JobType.IMPORT_OMNIVORE,
      );

      if (existingJobs.length > 0) {
        return c.json({ error: "An import job is already in progress." }, 409);
      }

      let file: File | null = null;
      try {
        const formData = await c.req.formData();
        const fileValue = formData.get("file");

        if (!fileValue || !(fileValue instanceof File)) {
          return c.json(
            { error: "No file uploaded or invalid file format." },
            400,
          );
        }
        if (fileValue.type !== "application/zip") {
          return c.json(
            { error: "Invalid file type. Please upload a ZIP file." },
            400,
          );
        }
        file = fileValue;
        log.info(`Received file: ${file.name}, size: ${file.size} bytes`);
      } catch (error) {
        log.error("Failed to parse form data or invalid file", { error });
        return c.json(
          { error: "Failed to parse form data or invalid file." },
          400,
        );
      }

      const newJobId = crypto.randomUUID();
      const storageKey = `${profileId}/${newJobId}.zip`;
      log.info(`Preparing to upload file to storage with key: ${storageKey}`);
      await storage.uploadImportFile(c.env, storageKey, file);

      const [newJob] = await db
        .insert(jobs)
        .values({
          id: newJobId,
          profileId,
          type: JobType.IMPORT_OMNIVORE,
          metadata: ImportOmnivoreMetadataSchema.parse({
            storageKey,
            status: ImportStatus.NOT_STARTED,
          }),
        })
        .returning({ id: jobs.id });

      const jobId = newJob.id;

      if (!jobId) {
        return c.json({ error: "Failed to create import job." }, 500);
      }

      try {
        await queue.send({ jobId });
      } catch (error) {
        log.error("Failed to send job to queue", { jobId, error });
        await db
          .update(jobs)
          .set({
            status: JobStatus.FAILED,
            errorMessage: "Failed to enqueue job",
          })
          .where(eq(jobs.id, jobId));
        return c.json({ jobId, error: "Failed to enqueue job." }, 500);
      }

      const response = ImportOmnivoreResponseSchema.parse({ jobId });
      return c.json(response, 200);
    } catch (error) {
      log.error("Error creating import job", { error });
      return c.json({ error: "Error creating import job." }, 500);
    }
  },
);
