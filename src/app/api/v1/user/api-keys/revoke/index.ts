import { and, eq } from "@app/api/db";
import { apiKeys } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import {
  RevokeApiKeyRequest,
  RevokeApiKeyRequestSchema,
  RevokeApiKeyResponse,
  RevokeApiKeyResponseSchema,
} from "@app/schemas/v1/user/api-keys/revoke";
import { Hono } from "hono";

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
    const profileId = c.get("profileId")!;
    const { keyId } = c.req.valid("json");

    try {
      const db = c.get("db");

      const result = await db
        .update(apiKeys)
        .set({ isActive: false })
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.profileId, profileId)))
        .returning({ keyId: apiKeys.id, isActive: apiKeys.isActive });

      if (result.length > 0) {
        const response = RevokeApiKeyResponseSchema.parse(result[0]);
        return c.json(response);
      }

      return c.json({ error: "API key not found" }, 404);
    } catch (error) {
      log(`Error revoking API key ${keyId} for user ${profileId}:`, error);
      return c.json({ error: "Failed to revoke API key" }, 500);
    }
  },
);
