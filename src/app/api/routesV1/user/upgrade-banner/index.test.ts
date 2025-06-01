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

import { userUpgradeBannerRouter } from "./index";

describe("POST /v1/user/upgrade-banner", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/user/upgrade-banner", userUpgradeBannerRouter);
  });

  it("should accept empty object and update timestamp", async () => {
    const [before] = await testDb.db
      .select({ upgradeBannerLastShownAt: profiles.upgradeBannerLastShownAt })
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));

    const response = await postRequest(app, "v1/user/upgrade-banner", {});
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const [profile] = await testDb.db
      .select({ upgradeBannerLastShownAt: profiles.upgradeBannerLastShownAt })
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
    expect(profile.upgradeBannerLastShownAt).not.toBeNull();
    expect(
      new Date(profile.upgradeBannerLastShownAt!).getTime(),
    ).toBeGreaterThan(new Date(before.upgradeBannerLastShownAt!).getTime());

    await testDb.db
      .update(profiles)
      .set({ upgradeBannerLastShownAt: before.upgradeBannerLastShownAt })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
  });
});
