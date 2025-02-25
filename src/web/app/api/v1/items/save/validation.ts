import { z } from "zod";

export const SaveRequestSchema = z.object({
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
});

export type SaveRequest = z.infer<typeof SaveRequestSchema>;

export const SaveResponseSchema = z.object({
  updated: z
    .array(
      z.object({
        slug: z.string(),
        profileItemId: z.string(),
      }),
    )
    .describe("A list of items that were successfully saved."),
});

export type SaveResponse = z.infer<typeof SaveResponseSchema>;
