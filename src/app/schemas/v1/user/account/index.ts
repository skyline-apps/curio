import "zod-openapi/extend";

import { z } from "zod";

export const DeleteAccountResponseSchema = z.object({
  success: z.boolean(),
});

export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;
