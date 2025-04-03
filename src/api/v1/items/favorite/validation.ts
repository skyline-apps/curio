import { z } from "zod";

export const UpdateFavoriteRequestSchema = z.object({
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
  favorite: z
    .boolean()
    .describe("Whether the items should be favorited or unfavorited."),
});

export type UpdateFavoriteRequest = z.infer<typeof UpdateFavoriteRequestSchema>;

export const UpdateFavoriteResponseSchema = z.object({
  updated: z
    .array(
      z.object({
        slug: z.string(),
      }),
    )
    .describe("A list of slugs that were successfully updated."),
});

export type UpdateFavoriteResponse = z.infer<
  typeof UpdateFavoriteResponseSchema
>;
