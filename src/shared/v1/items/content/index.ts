import "zod-openapi/extend";

import { UploadStatus } from "@shared/types/index";
import { ItemResultSchema } from "@shared/v1/items";
import { z } from "zod";

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
export type ItemResultWithHighlights = z.infer<
  typeof ItemResultWithHighlightsSchema
>;

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
    .min(1)
    .describe(
      "The HTML content for the item. Will replace the existing content only if it's longer.",
    ),
  url: z.string().min(1).describe("The URL of the item to update."),
  skipMetadataExtraction: z.boolean().optional().default(false),
});
export type UpdateItemContentRequest = z.infer<
  typeof UpdateItemContentRequestSchema
>;

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
