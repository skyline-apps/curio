import { eq } from "@app/api/db";
import { DbErrorCode } from "@app/api/db/errors";
import { jobs } from "@app/api/db/schema";
import { uploadImportFile } from "@app/api/lib/storage/__mocks__/index";
import { StorageError } from "@app/api/lib/storage/types";
import { ErrorResponse } from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  MOCK_QUEUE,
  postRequestFormData,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { TEST_JOB_ID_1 } from "@app/api/utils/test/data";
import { testDb } from "@app/api/utils/test/provider";
import {
  ImportOmnivoreMetadataSchema,
  ImportStatus,
  JobStatus,
  JobType,
} from "@app/schemas/db";
import { ImportOmnivoreResponse } from "@app/schemas/v1/jobs/import/omnivore";
import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { importOmnivoreRouter } from "./index";

describe("/v1/jobs/import/omnivore", () => {
  let app: Hono<EnvBindings>;

  beforeAll(() => {
    app = setUpMockApp("/v1/jobs/import/omnivore", importOmnivoreRouter);
  });

  describe("POST /v1/jobs/import/omnivore", () => {
    const createMockFormData = (
      fileContent: string | Blob,
      fileName: string,
      fileType: string,
    ): FormData => {
      const formData = new FormData();
      const blob =
        typeof fileContent === "string"
          ? new Blob([fileContent], { type: fileType })
          : fileContent;
      formData.append("file", blob, fileName);
      return formData;
    };

    it("should return 200 and create a new job if valid zip file is provided and no existing job is pending/running", async () => {
      const mockFileContent = "mock zip content";
      const mockFileName = "omnivore_export.zip";
      const mockFileType = "application/zip";
      const formData = createMockFormData(
        mockFileContent,
        mockFileName,
        mockFileType,
      );

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
      );
      expect(response.status).toBe(200);

      const data: ImportOmnivoreResponse = await response.json();
      expect(data.jobId).toBeDefined();

      expect(uploadImportFile).toHaveBeenCalledTimes(1);
      const storageKey = `${DEFAULT_TEST_PROFILE_ID}/${data.jobId}.zip`;
      expect(uploadImportFile).toHaveBeenCalledWith(
        expect.any(Object),
        storageKey,
        expect.any(File),
      );

      const createdJob = await testDb.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, data.jobId));
      expect(createdJob).toHaveLength(1);
      expect(createdJob[0]).toEqual(
        expect.objectContaining({
          profileId: DEFAULT_TEST_PROFILE_ID,
          type: JobType.IMPORT_OMNIVORE,
          metadata: ImportOmnivoreMetadataSchema.parse({
            storageKey,
            status: ImportStatus.NOT_STARTED,
          }),
          status: JobStatus.PENDING,
        }),
      );

      expect(MOCK_QUEUE.send).toHaveBeenCalledTimes(1);
      expect(MOCK_QUEUE.send).toHaveBeenCalledWith({ jobId: data.jobId });
    });

    it("should return 409 if a job is already pending", async () => {
      await testDb.db.insert(jobs).values({
        id: TEST_JOB_ID_1,
        profileId: DEFAULT_TEST_PROFILE_ID,
        type: JobType.IMPORT_OMNIVORE,
        status: JobStatus.PENDING,
      });
      const formData = createMockFormData("zip", "test.zip", "application/zip");

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
      );
      expect(response.status).toBe(409);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("An import job is already in progress.");
      expect(uploadImportFile).not.toHaveBeenCalled();
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 409 if a job is already running", async () => {
      await testDb.db.insert(jobs).values({
        id: TEST_JOB_ID_1,
        profileId: DEFAULT_TEST_PROFILE_ID,
        type: JobType.IMPORT_OMNIVORE,
        status: JobStatus.RUNNING,
      });
      const formData = createMockFormData("zip", "test.zip", "application/zip");

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
      );
      expect(response.status).toBe(409);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("An import job is already in progress.");
      expect(uploadImportFile).not.toHaveBeenCalled();
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 400 if no file is uploaded", async () => {
      const formData = new FormData();

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
      );
      expect(response.status).toBe(400);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("No file uploaded or invalid file format.");
      expect(uploadImportFile).not.toHaveBeenCalled();
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 400 if the uploaded file is not a zip file", async () => {
      const formData = createMockFormData(
        "text content",
        "test.txt",
        "text/plain",
      );

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
      );
      expect(response.status).toBe(400);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Invalid file type. Please upload a ZIP file.");
      expect(uploadImportFile).not.toHaveBeenCalled();
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 500 if storage upload fails", async () => {
      vi.mocked(uploadImportFile).mockRejectedValueOnce(
        new StorageError("Storage upload failed"),
      );
      const formData = createMockFormData("zip", "test.zip", "application/zip");

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
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

      const formData = createMockFormData("zip", "test.zip", "application/zip");

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
      );
      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Error creating import job.");

      expect(uploadImportFile).toHaveBeenCalledTimes(1);
      expect(MOCK_QUEUE.send).not.toHaveBeenCalled();
    });

    it("should return 500 and update job status to FAILED if queue send fails", async () => {
      vi.mocked(MOCK_QUEUE.send).mockRejectedValueOnce(
        new Error("Queue send error"),
      );
      const formData = createMockFormData("zip", "test.zip", "application/zip");

      const response = await postRequestFormData(
        app,
        "/v1/jobs/import/omnivore",
        formData,
      );
      expect(response.status).toBe(500);
      const data: ImportOmnivoreResponse & ErrorResponse =
        await response.json();
      expect(data.jobId).toBeDefined();
      expect(data.error).toBe("Failed to enqueue job.");

      expect(uploadImportFile).toHaveBeenCalledTimes(1);

      const updatedJob = await testDb.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, data.jobId));
      expect(updatedJob).toHaveLength(1);
      expect(updatedJob[0]).toEqual(
        expect.objectContaining({
          status: JobStatus.FAILED,
          errorMessage: "Failed to enqueue job",
        }),
      );
    });
  });
});
