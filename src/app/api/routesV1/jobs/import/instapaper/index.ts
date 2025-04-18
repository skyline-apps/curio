import { eq } from "@app/api/db";
import { getIncompleteJobs } from "@app/api/db/dal/jobs";
import { jobs } from "@app/api/db/schema";
import { Instapaper } from "@app/api/lib/instapaper";
import { InstapaperError } from "@app/api/lib/instapaper/types";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  ImportInstapaperMetadataSchema,
  ImportStatus,
  JobStatus,
  JobType,
} from "@app/schemas/db";
import {
  ImportInstapaperRequest,
  ImportInstapaperRequestSchema,
  ImportInstapaperResponse,
  ImportInstapaperResponseSchema,
} from "@app/schemas/v1/jobs/import/instapaper";
import { Hono } from "hono";

export const importInstapaperRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc(
      "post",
      ImportInstapaperRequestSchema,
      ImportInstapaperResponseSchema,
    ),
  ),
  zValidator(
    "json",
    ImportInstapaperRequestSchema,
    parseError<ImportInstapaperRequest, ImportInstapaperResponse>,
  ),
  async (c): Promise<APIResponse<ImportInstapaperResponse>> => {
    const log = c.get("log");
    const { username, password } = c.req.valid("json");
    const profileId = c.get("profileId")!;
    const queue = c.env.ITEMS_FETCHER_QUEUE;
    const db = c.get("db");
    try {
      const instapaper = new Instapaper(c.env);

      const accessToken = await instapaper.getAccessToken(username, password);
      const existingJobs = await getIncompleteJobs(
        db,
        profileId,
        JobType.IMPORT_INSTAPAPER,
      );

      if (existingJobs.length > 0) {
        return c.json({ error: "An import job is already in progress." }, 409);
      }

      const [newJob] = await db
        .insert(jobs)
        .values({
          profileId,
          type: JobType.IMPORT_INSTAPAPER,
          metadata: ImportInstapaperMetadataSchema.parse({
            accessToken,
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

      const response = ImportInstapaperResponseSchema.parse({ jobId });
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof InstapaperError && error.message.includes("401")) {
        log.error("Invalid Instapaper credentials", { error: error.message });
        return c.json({ error: "Invalid Instapaper credentials." }, 401);
      }
      log.error("Error creating import job", { error });
      return c.json({ error: "Error creating import job." }, 500);
    }
  },
);
