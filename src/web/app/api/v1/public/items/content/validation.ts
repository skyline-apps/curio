import {
  ItemResultSchema,
  PublicItemResultSchema,
} from "@web/app/api/v1/items/validation";
import { z } from "zod";

export const HighlightSchema = z.object({
  id: z.string(),
  startOffset: z.number(),
  endOffset: z.number(),
  text: z.string().nullable(),
  note: z.string().nullable(),
});

export const ItemResultWithHighlightsSchema = ItemResultSchema.extend({
  highlights: z.array(HighlightSchema).optional(),
});

export const GetItemContentRequestSchema = z.object({
  slug: z.string().describe("The unique slug of the item to retrieve."),
});

export const GetItemContentResponseSchema = z.union([
  z.object({
    content: z.string().optional(),
    item: z.union([ItemResultWithHighlightsSchema, PublicItemResultSchema]),
  }),
  z.object({
    error: z.string(),
  }),
]);

export type GetItemContentResponse = z.infer<
  typeof GetItemContentResponseSchema
>;
