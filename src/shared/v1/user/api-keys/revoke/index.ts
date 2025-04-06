import "zod-openapi/extend";

import { z } from "zod";

export const RevokeApiKeyRequestSchema = z.object({
  keyId: z.string(),
});

export const RevokeApiKeyResponseSchema = z.object({
  keyId: z.string(),
  isActive: z.boolean(),
});

export type RevokeApiKeyRequest = z.infer<typeof RevokeApiKeyRequestSchema>;
export type RevokeApiKeyResponse = z.infer<typeof RevokeApiKeyResponseSchema>;
