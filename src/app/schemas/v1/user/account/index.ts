import "zod-openapi/extend";

import { z } from "zod";

export const DeleteAccountRequestSchema = z.object({});

export const DeleteAccountResponseSchema = z.object({
  success: z.boolean(),
});

export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;
