import "zod-openapi/extend";

import { ImportMetadataSchema, JobStatus, JobType } from "@app/schemas/db";
import { dateType } from "@app/schemas/types";
import { z } from "zod";

const ImportJobSchema = z.object({
  id: z.string().describe("ID of the job"),
  status: z.nativeEnum(JobStatus).describe("Status of the job"),
  type: z.nativeEnum(JobType).describe("Type of the job"),
  metadata: ImportMetadataSchema.describe("Metadata of the job"),
  createdAt: dateType.describe("Date the job was created"),
  updatedAt: dateType.describe("Date the job was last updated"),
  startedAt: dateType.describe("Date the job started"),
  completedAt: dateType.describe("Date the job completed"),
  errorMessage: z.string().describe("Error message of the job"),
});

export const ImportJobsRequestSchema = z.object({});
export type ImportJobsRequest = z.infer<typeof ImportJobsRequestSchema>;

export const ImportJobsResponseSchema = z.object({
  jobs: z.array(ImportJobSchema),
});

export type ImportJobsResponse = z.infer<typeof ImportJobsResponseSchema>;
