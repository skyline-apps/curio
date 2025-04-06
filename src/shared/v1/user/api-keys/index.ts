import "zod-openapi/extend";

import { dateType } from "@shared/types";
import { z } from "zod";

export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(30),
});
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;

export const CreateApiKeyResponseSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  createdAt: dateType,
});
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;

export const GetApiKeysRequestSchema = z.object({});

export const GetApiKeysResponseSchema = z.object({
  keys: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: dateType,
    }),
  ),
});

export type GetApiKeysRequest = z.infer<typeof GetApiKeysRequestSchema>;
export type GetApiKeysResponse = z.infer<typeof GetApiKeysResponseSchema>;
