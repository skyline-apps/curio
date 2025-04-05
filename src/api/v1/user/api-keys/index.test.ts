import { eq } from "@api/db";
import { apiKeys } from "@api/db/schema";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  getRequest,
  postRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import { testDb } from "@api/utils/test/provider";
import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { userApiKeysRouter } from "./index";
import { CreateApiKeyResponse, GetApiKeysResponse } from "./validation";

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
      expect(keys[1].name).toBe("Test Key 2");
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
