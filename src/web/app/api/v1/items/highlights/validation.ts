import { z } from "zod";

export const HighlightSchema = z.object({
  id: z.string().uuid(),
  startOffset: z
    .number()
    .min(0)
    .describe("Index of start position within its node"),
  endOffset: z
    .number()
    .min(0)
    .describe("Index of end position within its node"),
  text: z.string().nullable().describe("The text of the highlight"),
  note: z.string().nullable().describe("User note about the highlight"),
});

export const NewHighlightSchema = HighlightSchema.extend({
  id: z
    .string()
    .uuid()
    .optional()
    .describe("Optional ID for updating an existing highlight"),
});

export type Highlight = z.infer<typeof HighlightSchema>;
export type NewHighlight = z.infer<typeof NewHighlightSchema>;

export const CreateOrUpdateHighlightRequestSchema = z.object({
  slug: z.string().describe("The slug of the item to add highlights to."),
  highlights: z.array(NewHighlightSchema),
});

export type CreateOrUpdateHighlightRequest = z.infer<
  typeof CreateOrUpdateHighlightRequestSchema
>;

export const CreateOrUpdateHighlightResponseSchema = z.object({
  highlights: z.array(HighlightSchema),
});

export type CreateOrUpdateHighlightResponse = z.infer<
  typeof CreateOrUpdateHighlightResponseSchema
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
