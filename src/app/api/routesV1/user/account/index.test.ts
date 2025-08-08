import { eq } from "@app/api/db";
import {
  items,
  profileItemHighlights,
  profileItems,
  profiles,
} from "@app/api/db/schema";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  deleteRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import {
  MOCK_HIGHLIGHTS,
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
} from "@app/api/utils/test/data";
import { testDb } from "@app/api/utils/test/provider";
import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { userAccountRouter } from "./index";

describe("DELETE /v1/user/account", () => {
  let app: Hono<EnvBindings>;
  const testProfileId: string = DEFAULT_TEST_PROFILE_ID;

  beforeEach(async () => {
    app = setUpMockApp("/v1/user/account", userAccountRouter);
    await testDb.raw.query(`
      INSERT INTO auth.users (id, email)
      VALUES ('00000000-0000-0000-0000-000000000001', 'testuser@example.com')
      ON CONFLICT (id) DO NOTHING;
    `);
    await testDb.db.delete(profiles).where(eq(profiles.id, testProfileId));
    await testDb.db
      .insert(profiles)
      .values({
        id: testProfileId,
        username: "testuser",
        userId: "00000000-0000-0000-0000-000000000001",
      })
      .returning();
  });

  afterEach(async () => {
    await testDb.db.delete(profiles).where(eq(profiles.id, testProfileId));
  });

  it("should delete the user profile", async () => {
    const response = await deleteRequest(app, "v1/user/account");
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
    const dbProfile = await testDb.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, testProfileId))
      .limit(1);
    expect(dbProfile.length).toBe(0);
  });

  it("should return 404 if profile does not exist", async () => {
    // Ensure the profile is deleted before the request
    await testDb.db.delete(profiles).where(eq(profiles.id, testProfileId));
    const response = await deleteRequest(app, "v1/user/account");
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: "Profile not found" });
  });

  it("should cascade delete profileItems and highlights when profile is deleted", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS[0]);
    const profileItem = { ...MOCK_PROFILE_ITEMS[0], profileId: testProfileId };
    await testDb.db.insert(profileItems).values(profileItem);
    const highlight = { ...MOCK_HIGHLIGHTS[0], profileItemId: profileItem.id };
    await testDb.db.insert(profileItemHighlights).values(highlight);

    let dbProfileItems = await testDb.db
      .select()
      .from(profileItems)
      .where(eq(profileItems.profileId, testProfileId));
    expect(dbProfileItems.length).toBe(1);
    let dbHighlights = await testDb.db
      .select()
      .from(profileItemHighlights)
      .where(eq(profileItemHighlights.profileItemId, profileItem.id));
    expect(dbHighlights.length).toBe(1);

    const response = await deleteRequest(app, "v1/user/account");
    expect(response.status).toBe(200);

    dbProfileItems = await testDb.db
      .select()
      .from(profileItems)
      .where(eq(profileItems.profileId, testProfileId));
    expect(dbProfileItems.length).toBe(0);
    dbHighlights = await testDb.db
      .select()
      .from(profileItemHighlights)
      .where(eq(profileItemHighlights.profileItemId, profileItem.id));
    expect(dbHighlights.length).toBe(0);
  });
});
