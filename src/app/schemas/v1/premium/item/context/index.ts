import { z } from "zod";

export const PremiumItemContextRequestSchema = z.object({
  slug: z.string().min(1).describe("The slug of the item."),
  snippet: z.string().min(1).describe("The text snippet to explain."),
  versionName: z
    .string()
    .max(255)
    .nullable()
    .describe(
      "The version name of the item. If null, the latest version will be used.",
    ),
});

export type PremiumItemContextRequest = z.infer<
  typeof PremiumItemContextRequestSchema
>;

export const PremiumItemContextResponseSchema = z.object({
  explanation: z.string(),
});

export type PremiumItemContextResponse = z.infer<
  typeof PremiumItemContextResponseSchema
>;
