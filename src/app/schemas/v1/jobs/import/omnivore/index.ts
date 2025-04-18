import "zod-openapi/extend";

import { z } from "zod";

export const ImportOmnivoreRequestSchema = z.object({});

export type ImportOmnivoreRequest = z.infer<typeof ImportOmnivoreRequestSchema>;

export const ImportOmnivoreResponseSchema = z.object({
  jobId: z.string().describe("ID of the created job"),
});

export type ImportOmnivoreResponse = z.infer<
  typeof ImportOmnivoreResponseSchema
>;
