import { eq } from "@app/api/db";
import { DbErrorCode } from "@app/api/db/errors";
import { profiles } from "@app/api/db/schema";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  getRequest,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { testDb } from "@app/api/utils/test/provider";
import { ColorScheme, DisplayFont, DisplayFontSize } from "@app/schemas/db";
import { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { userSettingsRouter } from "./index";

describe("/v1/user/settings", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/user/settings", userSettingsRouter);
  });

  describe("GET /v1/user/settings", () => {
    beforeEach(async () => {
      await testDb
        .update(profiles)
        .set({
          colorScheme: ColorScheme.DARK,
          displayFont: DisplayFont.SANS,
          displayFontSize: DisplayFontSize.MD,
          public: false,
        })
        .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
    });

    it("should return 200 with the user's current color scheme", async () => {
      const response = await getRequest(app, "v1/user/settings");
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toEqual({
        analyticsTracking: true,
        colorScheme: ColorScheme.DARK,
        displayFont: DisplayFont.SANS,
        displayFontSize: DisplayFontSize.MD,
        public: false,
      });
    });
  });

  describe("POST /v1/user/settings", () => {
    it("should return 200 when successfully updating the user's color scheme", async () => {
      const colorScheme = ColorScheme.LIGHT;
      const response = await postRequest(app, "v1/user/settings", {
        colorScheme,
      });
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toEqual({
        colorScheme,
      });

      const profile = await testDb.db.query.profiles.findFirst({
        where: eq(profiles.id, DEFAULT_TEST_PROFILE_ID),
      });
      expect(profile?.colorScheme).toBe(colorScheme);
    });

    it("should return 200 when successfully updating the user's public status", async () => {
      const response = await postRequest(app, "v1/user/settings", {
        public: true,
      });
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toEqual({
        public: true,
      });

      const allProfiles = await testDb.db
        .select()
        .from(profiles)
        .orderBy(profiles.id);
      expect(allProfiles).toHaveLength(2);
      expect(allProfiles[0].public).toBe(true);
      expect(allProfiles[0].id).toBe(DEFAULT_TEST_PROFILE_ID);
      expect(allProfiles[1].public).toBe(false);
      expect(allProfiles[1].id).toBe(DEFAULT_TEST_PROFILE_ID_2);
    });

    it("should return 400 if the settings object is invalid", async () => {
      const response = await postRequest(app, "v1/user/settings", {
        invalidSetting: "hi",
      });
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toEqual({
        error:
          "Invalid request parameters:\nUnrecognized key(s) in object: 'invalidSetting'",
      });
    });

    it("should return 400 if the color scheme choice is invalid", async () => {
      const response = await postRequest(app, "v1/user/settings", {
        colorScheme: "bad color",
      });
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toEqual({
        error:
          "Invalid request parameters:\ncolorScheme: Invalid enum value. Expected 'auto' | 'light' | 'dark', received 'bad color'",
      });
    });

    it("should return 500 if database error in update", async () => {
      vi.spyOn(testDb.db, "update").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const colorScheme = ColorScheme.LIGHT;
      const response = await postRequest(app, "v1/user/settings", {
        colorScheme,
      });
      expect(response.status).toBe(500);

      const result = await response.json();
      expect(result).toEqual({ error: "Error updating settings." });
    });
  });
});
