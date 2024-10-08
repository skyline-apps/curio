/**
 * @jest-environment node
 */
import { db } from "__mocks__/db";

import { DbErrorCode } from "@/db/errors";
import {
  makeAuthenticatedMockRequest,
  makeMockRequest,
} from "@/utils/test/api";

import { POST } from "./route";

describe("POST /api/v1/user/username", () => {
  test("should return 401 if no userId is present in the headers", async () => {
    const response = await POST(makeMockRequest({ username: "newusername" }));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized." });
  });

  test("should return 400 if username is missing", async () => {
    const response = await POST(makeAuthenticatedMockRequest({}));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Username is required." });
  });

  test("should return 400 if new username is empty", async () => {
    const response = await POST(makeAuthenticatedMockRequest({ username: "" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Username cannot be empty." });
  });

  test("should return 400 if new username is invalid", async () => {
    const response = await POST(
      makeAuthenticatedMockRequest({ username: "k" }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Username must be at least 2 characters." });
  });

  test("should return 500 if database update fails (no user updated)", async () => {
    // Mock the db.update chain
    db.update().set().where().returning.mockResolvedValue([]);

    const response = await POST(
      makeAuthenticatedMockRequest({ username: "newusername" }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Failed to update username." });
  });

  test("should return 200 and updated username when update is successful", async () => {
    // Mock the db.update chain
    db.update()
      .set()
      .where()
      .returning.mockResolvedValue([{ updatedUsername: "newusername" }]);

    const response = await POST(
      makeAuthenticatedMockRequest({ username: "newusername" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ updatedUsername: "newusername" });
  });

  test("should return 400 if username is already in use (unique violation)", async () => {
    // Mock the db.update chain to throw a unique violation error
    const mockError = { code: DbErrorCode.UniqueViolation };

    db.update().set().where().returning.mockRejectedValue(mockError);

    const response = await POST(
      makeAuthenticatedMockRequest({ username: "existingusername" }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Username already in use." });
  });

  test("should return 500 if unknown error occurs during database update", async () => {
    // Mock the db.update chain to throw an unknown error
    const mockError = { code: "XXX" };

    db.update().set().where().returning.mockRejectedValue(mockError);

    const response = await POST(
      makeAuthenticatedMockRequest({ username: "newusername" }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Unknown error updating username." });
  });
});
