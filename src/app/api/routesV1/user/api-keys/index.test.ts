import { eq } from "@app/api/db";
import { apiKeys } from "@app/api/db/schema";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  getRequest,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { testDb } from "@app/api/utils/test/provider";
import {
  CreateApiKeyResponse,
  GetApiKeysResponse,
} from "@app/schemas/v1/user/api-keys";
import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { userApiKeysRouter } from "./index";

describe("/v1/user/api-keys", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/user/api-keys", userApiKeysRouter);
  });
  afterAll(async () => {
    await testDb.db.delete(apiKeys).execute();
  });

  describe("GET /v1/user/api-keys", () => {
    it("should return empty array when no keys exist", async () => {
      await testDb.db.delete(apiKeys).execute();

      const response = await getRequest(app, "v1/user/api-keys");
      expect(response.status).toBe(200);

      const { keys }: GetApiKeysResponse = await response.json();
      expect(keys).toEqual([]);
    });

    it("should return existing API keys", async () => {
      await testDb.db.insert(apiKeys).values([
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          key: "ck_test123",
          name: "Test Key 1",
          lastUsedAt: new Date("2025-04-09T20:00:00.000Z"),
        },
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          key: "ck_test456",
          name: "Test Key 2",
        },
      ]);

      const response = await getRequest(app, "v1/user/api-keys");
      expect(response.status).toBe(200);

      const { keys }: GetApiKeysResponse = await response.json();
      expect(keys.length).toBe(2);
      expect(keys[0].name).toBe("Test Key 1");
      expect(keys[0].lastUsedAt).toBe("2025-04-09T20:00:00.000Z");
      expect(keys[0].isActive).toBe(true);
      expect(keys[1].name).toBe("Test Key 2");
      expect(keys[1].lastUsedAt).toBeUndefined();
      expect(keys[1].isActive).toBe(true);
    });
  });

  describe("POST /v1/user/api-keys", () => {
    it("should create a new API key", async () => {
      const response = await postRequest(app, "v1/user/api-keys", {
        name: "Test Key",
      });

      expect(response.status).toBe(200);

      const apiKey: CreateApiKeyResponse = await response.json();
      expect(apiKey.name).toBe("Test Key");
      expect(apiKey.key).toMatch(/^ck_[a-f0-9]{64}$/);

      const dbKey = await testDb.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, apiKey.id))
        .limit(1);

      expect(dbKey[0]).toBeDefined();
      expect(dbKey[0].name).toBe("Test Key");
    });

    it("should reject invalid names", async () => {
      const longName = "a".repeat(31);
      const response = await postRequest(app, "v1/user/api-keys", {
        name: longName,
      });

      expect(response.status).toBe(400);
    });
  });
});
