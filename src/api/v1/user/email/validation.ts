import "zod-openapi/extend";

import { z } from "zod";

export const UpdateEmailResponseSchema = z.object({
  updatedNewsletterEmail: z.string(),
});

export type UpdateEmailResponse = z.infer<typeof UpdateEmailResponseSchema>;
