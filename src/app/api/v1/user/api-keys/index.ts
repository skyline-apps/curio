import { eq } from "@app/api/db";
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
import { generateApiKey } from "@app/api/utils/random";
import {
  CreateApiKeyRequest,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponse,
  CreateApiKeyResponseSchema,
  GetApiKeysRequest,
  GetApiKeysRequestSchema,
  GetApiKeysResponse,
  GetApiKeysResponseSchema,
} from "@app/schemas/v1/user/api-keys";
import { Hono } from "hono";

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
      const profileId = c.get("profileId")!;

      try {
        const db = c.get("db");
        const keys = await db.query.apiKeys.findMany({
          where: eq(apiKeys.profileId, profileId),
        });

        return c.json(GetApiKeysResponseSchema.parse({ keys }));
      } catch (error) {
        log(`Error listing API keys for user ${profileId}:`, error);
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
      const profileId = c.get("profileId")!;

      try {
        const { name } = c.req.valid("json");
        if (!name || name.length > 30) {
          return c.json({ error: "Invalid name" }, 400);
        }

        const db = c.get("db");
        const key = generateApiKey();
        const [apiKey] = await db
          .insert(apiKeys)
          .values({
            profileId,
            key,
            name,
          })
          .returning();

        return c.json(CreateApiKeyResponseSchema.parse(apiKey));
      } catch (error) {
        log(`Error creating API key for user ${profileId}:`, error);
        return c.json({ error: "Failed to create API key" }, 500);
      }
    },
  );
