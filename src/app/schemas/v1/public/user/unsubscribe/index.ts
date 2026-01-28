import { z } from "zod";

export const UnsubscribeRequestSchema = z.object({
  profileId: z
    .string()
    .uuid()
    .describe("The ID of the profile to unsubscribe."),
});

export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;

export const UnsubscribeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type UnsubscribeResponse = z.infer<typeof UnsubscribeResponseSchema>;
