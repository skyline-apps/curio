import { z } from "zod";

export const PremiumItemSummaryRequestSchema = z.object({
  slug: z.string().min(1).describe("The slug of the item."),
  versionName: z
    .string()
    .max(255)
    .nullable()
    .describe(
      "The version name of the item. If null, the latest version will be used.",
    ),
});

export type PremiumItemSummaryRequest = z.infer<
  typeof PremiumItemSummaryRequestSchema
>;

export const PremiumItemSummaryResponseSchema = z.object({
  summary: z.string().describe("The summary of the item in Markdown format."),
});

export type PremiumItemSummaryResponse = z.infer<
  typeof PremiumItemSummaryResponseSchema
>;
