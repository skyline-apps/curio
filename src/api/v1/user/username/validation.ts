import "zod-openapi/extend";

import { z } from "zod";

export const UpdateUsernameRequestSchema = z.object({
  username: z.string(),
});

export const UpdateUsernameResponseSchema = z.object({
  updatedUsername: z.string().optional(),
});

export type UpdateUsernameResponse = z.infer<
  typeof UpdateUsernameResponseSchema
>;
