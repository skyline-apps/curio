import { z } from "zod";

export const PremiumItemContextRequestSchema = z.object({
  slug: z.string().min(1),
  snippet: z.string().min(1),
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
