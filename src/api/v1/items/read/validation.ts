import "zod-openapi/extend";

import { z } from "zod";

export const ReadItemRequestSchema = z.object({
  slug: z.string(),
  readingProgress: z.number().min(0).max(100),
});

export type ReadItemRequest = z.infer<typeof ReadItemRequestSchema>;

export const ReadItemResponseSchema = z.object({
  slug: z.string(),
  readingProgress: z.number().min(0).max(100),
  versionName: z.string().nullable(),
});

export type ReadItemResponse = z.infer<typeof ReadItemResponseSchema>;
