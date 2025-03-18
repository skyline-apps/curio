import { vi } from "vitest";

import { eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import {
  ColorScheme,
  DisplayFont,
  DisplayFontSize,
  profiles,
} from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { GET, POST } from "./route";

describe("/api/v1/user/settings", () => {
  describe("GET /api/v1/user/settings", () => {
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
      const request: APIRequest = makeAuthenticatedMockRequest();

      const response = await GET(request);
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

  describe("POST /api/v1/user/settings", () => {
    it("should return 200 when successfully updating the user's color scheme", async () => {
      const colorScheme = ColorScheme.LIGHT;
      const request: APIRequest = makeAuthenticatedMockRequest({
        body: { colorScheme },
      });

      const response = await POST(request);
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
      const request: APIRequest = makeAuthenticatedMockRequest({
        body: { public: true },
      });

      const response = await POST(request);
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
      const request: APIRequest = makeAuthenticatedMockRequest({
        body: { invalidSetting: "hi" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toEqual(
        "Invalid request parameters:\nUnrecognized key(s) in object: 'invalidSetting'",
      );
    });

    it("should return 400 if the color scheme choice is invalid", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        body: { colorScheme: "bad color" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toEqual(
        "Invalid request parameters:\ncolorScheme: Invalid enum value. Expected 'auto' | 'light' | 'dark', received 'bad color'",
      );
    });

    test("should return 500 if database error in update", async () => {
      vi.spyOn(testDb.db, "update").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const colorScheme = ColorScheme.LIGHT;
      const request: APIRequest = makeAuthenticatedMockRequest({
        body: { colorScheme },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const result = await response.json();
      expect(result.error).toBe("Error updating settings.");
    });
  });
});
