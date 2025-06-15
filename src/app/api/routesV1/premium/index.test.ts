import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import { premiumMiddleware } from "@app/api/middleware/premium";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_USER_ID,
  DEFAULT_TEST_USER_ID_2,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { testDb } from "@app/api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";

const DUMMY_ROUTE = "/v1/premium/dummy";

describe("/api/v1/premium", () => {
  let dummyRouter: Hono<EnvBindings>;
  beforeAll(async () => {
    // eslint-disable-next-line @local/eslint-local-rules/api-middleware, @local/eslint-local-rules/api-validation, @local/eslint-local-rules/response-parse
    dummyRouter = new Hono<EnvBindings>().post("", premiumMiddleware, (c) =>
      c.json({ ok: true }),
    );
  });

  it("rejects if no profileId on context", async () => {
    // Set up app with no userId, so no profileId is set in context
    const app = setUpMockApp(DUMMY_ROUTE, dummyRouter, null);
    const response = await postRequest(app, DUMMY_ROUTE, {});
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects if profile not found", async () => {
    // Use a userId/profileId not present in setup
    const app = setUpMockApp(DUMMY_ROUTE, dummyRouter, "nonexistent-user-id");
    const response = await postRequest(app, DUMMY_ROUTE, {});
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects if not premium", async () => {
    // DEFAULT_TEST_USER_ID_2 is set up as non-premium in vitest.setup.api.ts
    const app = setUpMockApp(DUMMY_ROUTE, dummyRouter, DEFAULT_TEST_USER_ID_2);
    const response = await postRequest(app, DUMMY_ROUTE, {});
    expect(response.status).toBe(402);
    const data = await response.json();
    expect(data.error).toBe("Premium required");
  });

  it("rejects if premium expired", async () => {
    const [originalProfile] = await testDb.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID))
      .limit(1);
    // Update DEFAULT_TEST_PROFILE_ID to be expired
    await testDb.db
      .update(profiles)
      .set({
        isPremium: true,
        premiumExpiresAt: new Date(Date.now() - 10000),
      })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
    const app = setUpMockApp(DUMMY_ROUTE, dummyRouter, DEFAULT_TEST_USER_ID);
    const response = await postRequest(app, DUMMY_ROUTE, {});
    expect(response.status).toBe(402);
    const data = await response.json();
    expect(data.error).toBe("Premium expired");
    // Restore original profile
    await testDb.db
      .update(profiles)
      .set(originalProfile)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
  });

  it("allows valid premium user", async () => {
    // Update DEFAULT_TEST_PROFILE_ID to be premium and not expired
    await testDb.db
      .update(profiles)
      .set({
        isPremium: true,
        premiumExpiresAt: new Date(Date.now() + 10000),
      })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
    const app = setUpMockApp(DUMMY_ROUTE, dummyRouter, DEFAULT_TEST_USER_ID);
    const response = await postRequest(app, DUMMY_ROUTE, {});
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});
