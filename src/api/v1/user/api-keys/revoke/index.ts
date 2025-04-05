import { and, eq, getDb } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import { apiKeys } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  RevokeApiKeyRequest,
  RevokeApiKeyRequestSchema,
  RevokeApiKeyResponse,
  RevokeApiKeyResponseSchema,
} from "./validation";

export const userApiKeysRevokeRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", RevokeApiKeyRequestSchema, RevokeApiKeyResponseSchema),
  ),
  zValidator(
    "json",
    RevokeApiKeyRequestSchema,
    parseError<RevokeApiKeyRequest, RevokeApiKeyResponse>,
  ),
  async (c): Promise<APIResponse<RevokeApiKeyResponse>> => {
    const userId = c.get("userId");
    const { keyId } = await c.req.json<{ keyId: string }>();

    try {
      const profileResult = await checkUserProfile(c, userId);
      if ("error" in profileResult) {
        return profileResult.error as APIResponse<RevokeApiKeyResponse>;
      }
      const db = getDb(c);

      const result = await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(
          and(
            eq(apiKeys.id, keyId),
            eq(apiKeys.profileId, profileResult.profile.id),
          ),
        )
        .returning({ keyId: apiKeys.id, isActive: apiKeys.isActive });

      if (result.length > 0) {
        const response = RevokeApiKeyResponseSchema.parse(result[0]);
        return c.json(response);
      }

      return c.json({ error: "API key not found" }, 404);
    } catch (error) {
      log(`Error revoking API key ${keyId} for user ${userId}:`, error);
      return c.json({ error: "Failed to revoke API key" }, 500);
    }
  },
);
