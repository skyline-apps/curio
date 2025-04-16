import "zod-openapi/extend";

import { z } from "zod";

export const ImportInstapaperRequestSchema = z.object({
  username: z.string().min(1).describe("Instapaper username"),
  password: z.string().describe("Instapaper password"),
});

export type ImportInstapaperRequest = z.infer<
  typeof ImportInstapaperRequestSchema
>;

export const ImportInstapaperResponseSchema = z.object({
  jobId: z.string().describe("ID of the created job"),
});

export type ImportInstapaperResponse = z.infer<
  typeof ImportInstapaperResponseSchema
>;
