import "zod-openapi/extend";

import { z } from "zod";

export const ReadItemRequestSchema = z.object({
  slug: z.string().min(1),
  readingProgress: z.number().min(0).max(100),
});

export type ReadItemRequest = z.infer<typeof ReadItemRequestSchema>;

export const ReadItemResponseSchema = z.object({
  slug: z.string(),
  readingProgress: z.number().min(0).max(100),
  versionName: z.string().nullable(),
});

export type ReadItemResponse = z.infer<typeof ReadItemResponseSchema>;

export const MarkUnreadItemRequestSchema = z.object({
  slug: z.string().min(1),
});

export type MarkUnreadItemRequest = z.infer<typeof MarkUnreadItemRequestSchema>;

export const MarkUnreadItemResponseSchema = z.object({ slug: z.string() });

export type MarkUnreadItemResponse = z.infer<
  typeof MarkUnreadItemResponseSchema
>;
