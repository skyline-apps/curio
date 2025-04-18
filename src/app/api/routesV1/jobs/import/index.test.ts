import { jobs } from "@app/api/db/schema";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  getRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import {
  TEST_JOB_ID_1,
  TEST_JOB_ID_2,
  TEST_JOB_ID_3,
} from "@app/api/utils/test/data";
import { testDb } from "@app/api/utils/test/provider";
import { ImportStatus, JobStatus, JobType } from "@app/schemas/db";
import { ImportJobsResponse } from "@app/schemas/v1/jobs/import";
import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { importRouter } from "./index";

describe("/v1/jobs/import", () => {
  let app: Hono<EnvBindings>;

  beforeAll(async () => {
    app = setUpMockApp("/v1/jobs/import", importRouter);
  });

  describe("GET /v1/jobs/import", () => {
    const MOCK_JOBS = [
      {
        id: TEST_JOB_ID_1,
        profileId: DEFAULT_TEST_PROFILE_ID,
        type: JobType.IMPORT_INSTAPAPER,
        createdAt: new Date("2024-01-01T11:00:00Z"),
      },
      {
        id: TEST_JOB_ID_2,
        profileId: DEFAULT_TEST_PROFILE_ID,
        type: JobType.IMPORT_OMNIVORE,
        status: JobStatus.COMPLETED,
        createdAt: new Date("2024-01-01T12:00:00Z"),
        updatedAt: new Date("2024-01-01T12:20:00Z"),
        startedAt: new Date("2024-01-01T12:01:00Z"),
        finishedAt: new Date("2024-01-01T12:20:00Z"),
        metadata: {
          accessToken: { oauth_token: "token", oauth_token_secret: "secret" },
          status: ImportStatus.FETCHED_ITEMS,
          totalItems: 5,
          processedItems: 3,
        },
      },
      {
        id: TEST_JOB_ID_3,
        profileId: DEFAULT_TEST_PROFILE_ID_2,
        type: JobType.IMPORT_INSTAPAPER,
        createdAt: new Date("2024-01-01T13:00:00Z"),
      },
    ];

    it("should return 200 with an empty list if no import jobs exist for the user", async () => {
      await testDb.db.insert(jobs).values([MOCK_JOBS[2]]);

      const response = await getRequest(app, "/v1/jobs/import");
      expect(response.status).toBe(200);

      const data: ImportJobsResponse = await response.json();
      expect(data.jobs).toHaveLength(0);
    });

    it("should return 200 with only IMPORT_INSTAPAPER and IMPORT_OMNIVORE jobs for the current user, sorted by createdAt desc", async () => {
      await testDb.db.insert(jobs).values(MOCK_JOBS);

      const response = await getRequest(app, "/v1/jobs/import");
      expect(response.status).toBe(200);

      const data: ImportJobsResponse = await response.json();

      expect(data.jobs).toHaveLength(2);
      expect(data.jobs[0].id).toBe(TEST_JOB_ID_2);
      expect(data.jobs[0].type).toBe(JobType.IMPORT_OMNIVORE);
      expect(data.jobs[1].id).toBe(TEST_JOB_ID_1);
      expect(data.jobs[1].type).toBe(JobType.IMPORT_INSTAPAPER);
      expect(data.jobs[0].status).toBe(JobStatus.COMPLETED);
      expect(data.jobs[1].status).toBe(JobStatus.PENDING);
      expect(data.jobs[0].metadata).toEqual({
        status: ImportStatus.FETCHED_ITEMS,
        totalItems: 5,
        processedItems: 3,
      });
      expect(data.jobs[1].metadata).toEqual(null);

      expect(data.jobs.find((j) => j.id === TEST_JOB_ID_3)).toBeUndefined();
    });

    it("should return 500 if a database error occurs", async () => {
      vi.spyOn(testDb.db, "select").mockImplementationOnce(() => {
        throw new Error("Database connection failed");
      });

      const response = await getRequest(app, "/v1/jobs/import");
      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData).toEqual({ error: "Failed to get import jobs" });

      vi.restoreAllMocks();
    });
  });
});
