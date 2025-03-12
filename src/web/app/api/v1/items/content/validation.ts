import { z } from "zod";

import { ItemResultSchema } from "@/app/api/v1/items/validation";
import { UploadStatus } from "@/lib/storage/types";

export const HighlightSchema = z.object({
  id: z.string(),
  startOffset: z.number(),
  endOffset: z.number(),
  text: z.string().nullable(),
  note: z.string().nullable(),
});

export const ItemResultWithHighlightsSchema = ItemResultSchema.extend({
  highlights: z.array(HighlightSchema),
});

export const GetItemContentRequestSchema = z.object({
  slug: z.string().describe("The unique slug of the item to retrieve."),
});

export const GetItemContentResponseSchema = z.union([
  z.object({
    content: z.string().optional(),
    item: ItemResultWithHighlightsSchema,
  }),
  z.object({
    error: z.string(),
  }),
]);

export type GetItemContentResponse = z.infer<
  typeof GetItemContentResponseSchema
>;

export const UpdateItemContentRequestSchema = z.object({
  htmlContent: z
    .string()
    .describe(
      "The HTML content for the item. Will replace the existing content only if it's longer.",
    ),
  url: z.string().describe("The URL of the item to update."),
  skipMetadataExtraction: z.boolean().optional().default(false),
});

export const UpdateItemContentResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal(UploadStatus.UPDATED_MAIN),
    slug: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.STORED_VERSION),
    slug: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.SKIPPED),
    slug: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.ERROR),
    error: z.string(),
  }),
]);

export type UpdateItemContentResponse = z.infer<
  typeof UpdateItemContentResponseSchema
>;
