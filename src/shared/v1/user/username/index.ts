import "zod-openapi/extend";

import { z } from "zod";

export const UpdateUsernameRequestSchema = z.object({
  username: z.string(),
});

export type UpdateUsernameRequest = z.infer<typeof UpdateUsernameRequestSchema>;

export const UpdateUsernameResponseSchema = z.object({
  updatedUsername: z.string().optional(),
});

export type UpdateUsernameResponse = z.infer<
  typeof UpdateUsernameResponseSchema
>;
