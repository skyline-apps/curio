import { vi } from "vitest";

import { eq } from "@web/db";
import { DbErrorCode } from "@web/db/errors";
import { profiles } from "@web/db/schema";
import { APIRequest } from "@web/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_USER_ID,
  DEFAULT_TEST_USERNAME_2,
  makeAuthenticatedMockRequest,
  makeMockRequest,
} from "@web/utils/test/api";
import { testDb } from "@web/utils/test/provider";

import { POST } from "./route";

describe("POST /api/v1/user/username", () => {
  it("should return 401 if no userId is present in the headers", async () => {
    const response = await POST(
      makeMockRequest({
        method: "POST",
        body: { username: "newusername" },
      }),
    );
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized." });
  });

  it("should return 400 if username is missing", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {},
      userId: DEFAULT_TEST_USER_ID,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({
      error: "Invalid request parameters:\nusername: Required",
    });
  });

  it("should return 400 if new username is empty", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { username: "" },
      userId: DEFAULT_TEST_USER_ID,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Username cannot be empty." });
  });

  it("should return 400 if new username is invalid", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { username: "k" },
      userId: DEFAULT_TEST_USER_ID,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Username must be at least 2 characters." });
  });

  it("should return 200 and updated username when update is successful", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { username: "newusername" },
      userId: DEFAULT_TEST_USER_ID,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ updatedUsername: "newusername" });

    const profile = await testDb.db.query.profiles.findFirst({
      where: eq(profiles.id, DEFAULT_TEST_PROFILE_ID),
    });
    expect(profile?.username).toBe("newusername");
  });

  it("should return 400 if username is already in use", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { username: DEFAULT_TEST_USERNAME_2 },
      userId: DEFAULT_TEST_USER_ID,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Username already in use." });
  });

  it("should return 500 if database error in update", async () => {
    vi.spyOn(testDb.db, "update").mockImplementationOnce(() => {
      throw { code: DbErrorCode.ConnectionFailure };
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { username: "newusername" },
      userId: DEFAULT_TEST_USER_ID,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const result = await response.json();
    expect(result.error).toBe("Unknown error updating username.");
  });
});
