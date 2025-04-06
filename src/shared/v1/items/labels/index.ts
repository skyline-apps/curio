import "zod-openapi/extend";

import { z } from "zod";

export const UpdateLabelsRequestSchema = z.object({
  slugs: z
    .string()
    .transform((val) => (val ? val.split(",").map((s) => s.trim()) : undefined))
    .refine(
      (val) => !val || val.every((s) => s.length > 0),
      "Invalid slug format",
    )
    .describe(
      "A comma-separated list of slugs to update. If the slug is not found, it will be ignored.",
    ),
  labelIds: z
    .array(z.string().uuid())
    .describe("An array of label UUIDs to apply to the specified items."),
});

export type UpdateLabelsRequest = z.infer<typeof UpdateLabelsRequestSchema>;

export const UpdateLabelsResponseSchema = z.object({
  updated: z
    .array(
      z.object({
        slug: z.string(),
      }),
    )
    .describe("A list of slugs that were successfully updated."),
});

export type UpdateLabelsResponse = z.infer<typeof UpdateLabelsResponseSchema>;

export const BulkDeleteLabelsRequestSchema = z.object({
  slugs: z
    .string()
    .transform((val) => (val ? val.split(",").map((s) => s.trim()) : undefined))
    .refine(
      (val) => !val || val.every((s) => s.length > 0),
      "Invalid slug format",
    )
    .describe(
      "A comma-separated list of slugs to remove labels from. If the slug is not found, it will be ignored.",
    ),
  labelIds: z
    .array(z.string().uuid())
    .describe("An array of label UUIDs to remove from the specified items."),
});

export type BulkDeleteLabelsRequest = z.infer<
  typeof BulkDeleteLabelsRequestSchema
>;

export const BulkDeleteLabelsResponseSchema = z.object({
  deleted: z
    .array(
      z.object({
        slug: z.string(),
      }),
    )
    .describe("A list of slugs that had labels successfully deleted."),
});

export type BulkDeleteLabelsResponse = z.infer<
  typeof BulkDeleteLabelsResponseSchema
>;
