import { db } from "__mocks__/db";

import { DbErrorCode } from "@/db/errors";
import { ColorScheme } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import { makeAuthenticatedMockRequest } from "@/utils/test/api";

import { GET, POST } from "./route";

describe("GET /api/v1/user/settings", () => {
  it("should return 200 with the user's current color scheme", async () => {
    const colorScheme = ColorScheme.DARK;
    const request: APIRequest = makeAuthenticatedMockRequest();
    db.where.mockResolvedValue([{ colorScheme: colorScheme }]);

    const response = await GET(request);
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result).toEqual({
      colorScheme: ColorScheme.DARK,
    });

    expect(db.select).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/v1/user/settings", () => {
  it("should return 200 when successfully updating the user's color scheme", async () => {
    const colorScheme = ColorScheme.DARK;
    const request: APIRequest = makeAuthenticatedMockRequest({ colorScheme });
    db.returning.mockResolvedValue([{ colorScheme: colorScheme }]);

    const response = await POST(request);
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result).toEqual({
      colorScheme: ColorScheme.DARK,
    });

    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("should return 400 if the settings object is invalid", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      invalidSetting: "hi",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const result = await response.json();
    expect(result.error).toEqual(
      "Invalid settings:\nUnrecognized key(s) in object: 'invalidSetting'",
    );
  });

  it("should return 400 if the color scheme choice is invalid", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      colorScheme: "bad color",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const result = await response.json();
    expect(result.error).toEqual(
      "Invalid settings:\ncolorScheme: Invalid enum value. Expected 'auto' | 'light' | 'dark', received 'bad color'",
    );
  });

  test("should return 500 if database error in update", async () => {
    // Mock the db.update chain to throw a unique violation error
    const mockError = { code: DbErrorCode.ConnectionFailure };
    db.returning.mockRejectedValue(mockError);
    const colorScheme = ColorScheme.DARK;
    const request: APIRequest = makeAuthenticatedMockRequest({ colorScheme });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Error updating settings." });
    expect(db.update).toHaveBeenCalledTimes(1);
  });
});
