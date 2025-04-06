import "zod-openapi/extend";

import { z } from "zod";

export const UpdateEmailRequestSchema = z.object({});

export type UpdateEmailRequest = z.infer<typeof UpdateEmailRequestSchema>;

export const UpdateEmailResponseSchema = z.object({
  updatedNewsletterEmail: z.string(),
});

export type UpdateEmailResponse = z.infer<typeof UpdateEmailResponseSchema>;
