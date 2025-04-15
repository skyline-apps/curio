import "zod-openapi/extend";

import { z } from "zod";

export const GetUserResponseSchema = z.object({
  username: z.string(),
  newsletterEmail: z.string().nullable(),
});

export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
