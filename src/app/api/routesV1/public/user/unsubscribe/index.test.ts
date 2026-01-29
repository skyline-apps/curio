import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { testDb } from "@app/api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";

import { publicUnsubscribeRouter } from "./index";

describe("/v1/public/user/unsubscribe", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/public/user/unsubscribe", publicUnsubscribeRouter);
  });

  it("should return 200 and unsubscribe the user", async () => {
    // Ensure the profile has marketingEmails set to true.
    await testDb
      .update(profiles)
      .set({ marketingEmails: true })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));

    const response = await postRequest(app, "v1/public/user/unsubscribe", {
      profileId: DEFAULT_TEST_PROFILE_ID,
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({
      message: "You have been successfully unsubscribed from marketing emails.",
      success: true,
    });

    const profile = await testDb.db.query.profiles.findFirst({
      where: eq(profiles.id, DEFAULT_TEST_PROFILE_ID),
    });
    expect(profile?.marketingEmails).toBe(false);
  });

  it("should return 404 if profile does not exist", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await postRequest(app, "v1/public/user/unsubscribe", {
      profileId: nonExistentId,
    });

    expect(response.status).toBe(404);
    const result = await response.json();
    expect(result).toEqual({ error: "Profile not found" });
  });

  it("should return 400 if profileId is not a valid UUID", async () => {
    const response = await postRequest(app, "v1/public/user/unsubscribe", {
      profileId: "invalid-uuid",
    });

    expect(response.status).toBe(400);
  });
});
