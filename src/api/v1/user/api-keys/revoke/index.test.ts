import { eq } from "@api/db";
import { apiKeys } from "@api/db/schema";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  postRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import { testDb } from "@api/utils/test/provider";
import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { userApiKeysRevokeRouter } from "./index";

describe("POST /v1/user/api-keys/revoke", () => {
  let app: Hono<EnvBindings>;
  const testKeyId: string = "1234e567-89ab-cdef-1234-567890abcdef";

  beforeAll(async () => {
    app = setUpMockApp("/v1/user/api-keys/revoke", userApiKeysRevokeRouter);

    await testDb.db
      .insert(apiKeys)
      .values({
        id: testKeyId,
        profileId: DEFAULT_TEST_PROFILE_ID,
        key: "ck_test123",
        name: "Test Key",
        isActive: true,
      })
      .returning();
  });

  afterAll(async () => {
    await testDb.db.delete(apiKeys);
  });

  it("should revoke an API key by setting isActive to false", async () => {
    const response = await postRequest(app, "v1/user/api-keys/revoke", {
      keyId: testKeyId,
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ keyId: testKeyId, isActive: false });

    const dbKey = await testDb.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, testKeyId))
      .limit(1);

    expect(dbKey[0].isActive).toBe(false);
  });

  it("should return 404 for non-existent keys", async () => {
    const response = await postRequest(app, "v1/user/api-keys/revoke", {
      keyId: "1234e567-89ab-cdef-1234-567890abc000",
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "API key not found" });
  });
});
