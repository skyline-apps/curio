import { eq } from "@app/api/db";
import { DbErrorCode } from "@app/api/db/errors";
import { jobs } from "@app/api/db/schema";
import {
  MOCK_ACCESS_TOKEN,
  mockGetAccessToken,
} from "@app/api/lib/instapaper/__mocks__";
import { ErrorResponse } from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  MOCK_QUEUE,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { TEST_JOB_ID_1 } from "@app/api/utils/test/data";
import { testDb } from "@app/api/utils/test/provider";
import {
  ImportInstapaperMetadataSchema,
  ImportStatus,
  JobStatus,
  JobType,
} from "@app/schemas/db";
import { ImportInstapaperResponse } from "@app/schemas/v1/jobs/import/instapaper";
import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { importInstapaperRouter } from "./index";

describe("/v1/jobs/import/instapaper", () => {
  let app: Hono<EnvBindings>;

  beforeAll(() => {
    app = setUpMockApp("/v1/jobs/import/instapaper", importInstapaperRouter);
  });

  describe("POST /v1/jobs/import/instapaper", () => {
    const validPayload = {
      username: "testuser",
      password: "testpassword",
    };

    it("should return 200 and create a new job if no existing job is pending/running", async () => {
      const response = await postRequest(
        app,
        "/v1/jobs/import/instapaper",
        validPayload,
      );
      expect(response.status).toBe(200);

      const data: ImportInstapaperResponse = await response.json();
      expect(data.jobId).toBeDefined();

      const createdJob = await testDb.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, data.jobId));
      expect(createdJob).toHaveLength(1);
      expect(createdJob[0]).toEqual(
        expect.objectContaining({
          profileId: DEFAULT_TEST_PROFILE_ID,
          type: JobType.IMPORT_INSTAPAPER,
          metadata: ImportInstapaperMetadataSchema.parse({
            accessToken: MOCK_ACCESS_TOKEN,
            status: ImportStatus.NOT_STARTED,
          }),
          status: JobStatus.PENDING, // Default status on creation
        }),
      );

      // Verify queue send call
      expect(MOCK_QUEUE.send).toHaveBeenCalledTimes(1);
      expect(MOCK_QUEUE.send).toHaveBeenCalledWith({ jobId: data.jobId });
    });

    it("should return 409 if a job is already pending", async () => {
      await testDb.db.insert(jobs).values({
        id: TEST_JOB_ID_1,
        profileId: DEFAULT_TEST_PROFILE_ID,
        type: JobType.IMPORT_INSTAPAPER,
        status: JobStatus.PENDING,
      });

      const response = await postRequest(
        app,
        "/v1/jobs/import/instapaper",
        validPayload,
      );
      expect(response.status).toBe(409);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("An import job is already in progress.");
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 409 if a job is already running", async () => {
      await testDb.db.insert(jobs).values({
        id: TEST_JOB_ID_1,
        profileId: DEFAULT_TEST_PROFILE_ID,
        type: JobType.IMPORT_INSTAPAPER,
        status: JobStatus.RUNNING,
      });

      const response = await postRequest(
        app,
        "/v1/jobs/import/instapaper",
        validPayload,
      );
      expect(response.status).toBe(409);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("An import job is already in progress.");
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 500 if Instapaper authentication fails", async () => {
      vi.mocked(mockGetAccessToken).mockRejectedValueOnce(
        new Error("Instapaper auth failed"),
      );

      const response = await postRequest(
        app,
        "/v1/jobs/import/instapaper",
        validPayload,
      );
      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Error creating import job.");
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 500 if DB insert fails", async () => {
      vi.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await postRequest(
        app,
        "/v1/jobs/import/instapaper",
        validPayload,
      );
      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Error creating import job.");
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 500 and update job status to FAILED if queue send fails", async () => {
      vi.mocked(MOCK_QUEUE.send).mockImplementationOnce(() =>
        Promise.reject(new Error("Queue send error")),
      );
      const response = await postRequest(
        app,
        "/v1/jobs/import/instapaper",
        validPayload,
      );
      expect(response.status).toBe(500);
      const data: ImportInstapaperResponse = await response.json();
      expect(data.jobId).toBeDefined();

      const createdJob = await testDb.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, data.jobId));
      expect(createdJob).toHaveLength(1);
      expect(createdJob[0]).toEqual(
        expect.objectContaining({
          status: JobStatus.FAILED,
          errorMessage: "Failed to enqueue job",
        }),
      );
    });

    it("should return 400 if request body is missing username", async () => {
      const invalidPayload = {};
      const response = await postRequest(
        app,
        "/v1/jobs/import/instapaper",
        invalidPayload,
      );
      expect(response.status).toBe(400);
      const data: ErrorResponse = await response.json();
      expect(data.error).toContain("Invalid request parameters");
    });

    it("should return 200 if request body is missing password", async () => {
      const response = await postRequest(app, "/v1/jobs/import/instapaper", {
        username: "testuser",
        password: "",
      });
      expect(response.status).toBe(200);
    });
  });
});
