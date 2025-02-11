import { z } from "zod";

export const CreateHighlightRequestSchema = z.object({
  slug: z.string().describe("The slug of the item to add highlights to."),
  highlights: z.array(
    z.object({
      id: z
        .string()
        .uuid()
        .optional()
        .describe("Optional ID for updating an existing highlight"),
      startOffset: z
        .number()
        .min(0)
        .describe("Start position of the highlight"),
      endOffset: z.number().min(0).describe("End position of the highlight"),
      text: z.string().min(1).describe("The highlighted text content"),
      note: z.string().optional().describe("Optional note for the highlight"),
    }),
  ),
});

export type CreateHighlightRequest = z.infer<
  typeof CreateHighlightRequestSchema
>;

export const CreateHighlightResponseSchema = z.object({
  highlights: z.array(
    z.object({
      id: z.string().uuid(),
      startOffset: z.number(),
      endOffset: z.number(),
      text: z.string(),
      note: z.string().nullable(),
      createdAt: z.date(),
    }),
  ),
});

export type CreateHighlightResponse = z.infer<
  typeof CreateHighlightResponseSchema
>;

export const DeleteHighlightRequestSchema = z.object({
  slug: z.string().describe("The slug of the item to delete highlights from."),
  highlightIds: z
    .array(z.string().uuid())
    .min(1)
    .describe("Array of highlight IDs to delete"),
});

export type DeleteHighlightRequest = z.infer<
  typeof DeleteHighlightRequestSchema
>;

export const DeleteHighlightResponseSchema = z.object({
  deleted: z.array(
    z.object({
      id: z.string().uuid(),
    }),
  ),
});

export type DeleteHighlightResponse = z.infer<
  typeof DeleteHighlightResponseSchema
>;
