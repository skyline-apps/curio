import { and, desc, eq, inArray } from "@app/api/db";
import { jobs } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import { JobType } from "@app/schemas/db";
import {
  ImportJobsRequest,
  ImportJobsRequestSchema,
  ImportJobsResponse,
  ImportJobsResponseSchema,
} from "@app/schemas/v1/jobs/import";
import { Hono } from "hono";

import { importInstapaperRouter } from "./instapaper";
import { omnivoreImportRouter } from "./omnivore";

const importRouter = new Hono<EnvBindings>().get(
  "/",
  describeRoute(
    apiDoc("get", ImportJobsRequestSchema, ImportJobsResponseSchema),
  ),
  zValidator(
    "json",
    ImportJobsRequestSchema,
    parseError<ImportJobsRequest, ImportJobsResponse>,
  ),
  async (c): Promise<APIResponse<ImportJobsResponse>> => {
    const profileId = c.get("profileId")!;
    const db = c.get("db");
    try {
      const importJobs = await db
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.profileId, profileId),
            inArray(jobs.type, [
              JobType.IMPORT_INSTAPAPER,
              JobType.IMPORT_OMNIVORE,
            ]),
          ),
        )
        .orderBy(desc(jobs.createdAt));

      const response = ImportJobsResponseSchema.parse({ jobs: importJobs });
      return c.json(response);
    } catch (error) {
      c.get("log").error(`Error getting import jobs for user`, {
        profileId,
        error,
      });
      return c.json({ error: "Failed to get import jobs" }, 500);
    }
  },
);

importRouter.route("/instapaper", importInstapaperRouter);
importRouter.route("/omnivore", omnivoreImportRouter);

export { importRouter };
