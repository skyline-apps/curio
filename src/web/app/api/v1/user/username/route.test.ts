import { eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import { ColorScheme, profiles } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  makeAuthenticatedMockRequest,
  makeMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { POST } from "./route";

const TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174003";
const TEST_PROFILE_ID = "123e4567-e89b-12d3-a456-426614174003";

beforeAll(async () => {
  await testDb.raw.query(`
    INSERT INTO auth.users (id, email)
    VALUES ('${TEST_USER_ID}', 'test@example.com')
    ON CONFLICT (id) DO NOTHING;
  `);

  await testDb.db.insert(profiles).values({
    id: TEST_PROFILE_ID,
    userId: TEST_USER_ID,
    username: "testuser",
    colorScheme: ColorScheme.AUTO,
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  });
});

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
      userId: TEST_USER_ID,
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
      userId: TEST_USER_ID,
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
      userId: TEST_USER_ID,
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
      userId: TEST_USER_ID,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ updatedUsername: "newusername" });

    const profile = await testDb.db.query.profiles.findFirst({
      where: eq(profiles.id, TEST_PROFILE_ID),
    });
    expect(profile?.username).toBe("newusername");
  });

  it("should return 400 if username is already in use", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { username: "defaultuser" },
      userId: TEST_USER_ID,
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Username already in use." });
  });

  it("should return 500 if database error in update", async () => {
    jest.spyOn(testDb.db, "update").mockImplementationOnce(() => {
      throw { code: DbErrorCode.ConnectionFailure };
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { username: "newusername" },
      userId: TEST_USER_ID,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const result = await response.json();
    expect(result.error).toBe("Unknown error updating username.");
  });
});
