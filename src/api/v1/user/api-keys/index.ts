import { eq, getDb } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import { apiKeys } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { generateApiKey } from "@api/utils/random";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  CreateApiKeyRequest,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponse,
  CreateApiKeyResponseSchema,
  GetApiKeysRequest,
  GetApiKeysRequestSchema,
  GetApiKeysResponse,
  GetApiKeysResponseSchema,
} from "./validation";

export const userApiKeysRouter = new Hono<EnvBindings>()
  .get(
    "/",
    describeRoute(
      apiDoc("get", GetApiKeysRequestSchema, GetApiKeysResponseSchema),
    ),
    zValidator(
      "query",
      GetApiKeysRequestSchema,
      parseError<GetApiKeysRequest, GetApiKeysResponse>,
    ),
    async (c): Promise<APIResponse<GetApiKeysResponse>> => {
      const userId = c.get("userId");

      try {
        const profileResult = await checkUserProfile(c, userId);
        if (profileResult.error) {
          return profileResult.error;
        }

        const db = getDb(c);
        const keys = await db.query.apiKeys.findMany({
          where: eq(apiKeys.profileId, profileResult.profile.id),
        });

        return c.json(GetApiKeysResponseSchema.parse({ keys }));
      } catch (error) {
        log(`Error listing API keys for user ${userId}:`, error);
        return c.json({ error: "Failed to list API keys" }, 500);
      }
    },
  )
  .post(
    "/",
    describeRoute(
      apiDoc("post", CreateApiKeyRequestSchema, CreateApiKeyResponseSchema),
    ),
    zValidator(
      "json",
      CreateApiKeyRequestSchema,
      parseError<CreateApiKeyRequest, CreateApiKeyResponse>,
    ),
    async (c): Promise<APIResponse<CreateApiKeyResponse>> => {
      const userId = c.get("userId");

      try {
        const { name } = c.req.valid("json");
        const profileResult = await checkUserProfile(c, userId);
        if (profileResult.error) {
          return profileResult.error;
        }

        if (!name || name.length > 30) {
          return c.json({ error: "Invalid name" }, 400);
        }

        const db = getDb(c);
        const key = generateApiKey();
        const [apiKey] = await db
          .insert(apiKeys)
          .values({
            profileId: profileResult.profile.id,
            key,
            name,
          })
          .returning();

        return c.json(CreateApiKeyResponseSchema.parse(apiKey));
      } catch (error) {
        log(`Error creating API key for user ${userId}:`, error);
        return c.json({ error: "Failed to create API key" }, 500);
      }
    },
  );
