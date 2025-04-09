import { eq } from "@app/api/db";
import { DbErrorCode } from "@app/api/db/errors";
import { profiles } from "@app/api/db/schema";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_USERNAME_2,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { testDb } from "@app/api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { userUsernameRouter } from "./index";

describe("POST /v1/user/username", () => {
  let app: Hono<EnvBindings>;

  beforeAll(() => {
    app = setUpMockApp("/v1/user/username", userUsernameRouter);
  });

  it("should return 400 if username is missing", async () => {
    const response = await postRequest(app, "v1/user/username", {});
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({
      error: "Invalid request parameters:\nusername: Required",
    });
  });

  it("should return 400 if new username is empty", async () => {
    const response = await postRequest(app, "v1/user/username", {
      username: "",
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Username cannot be empty." });
  });

  it("should return 400 if new username is invalid", async () => {
    const response = await postRequest(app, "v1/user/username", {
      username: "k",
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Username must be at least 2 characters." });
  });

  it("should return 200 and updated username when update is successful", async () => {
    const response = await postRequest(app, "v1/user/username", {
      username: "newusername",
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ updatedUsername: "newusername" });

    const profile = await testDb.db.query.profiles.findFirst({
      where: eq(profiles.id, DEFAULT_TEST_PROFILE_ID),
    });
    expect(profile?.username).toBe("newusername");
  });

  it("should return 400 if username is already in use", async () => {
    const response = await postRequest(app, "v1/user/username", {
      username: DEFAULT_TEST_USERNAME_2,
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Username already in use." });
  });

  it("should return 500 if database error in update", async () => {
    vi.spyOn(testDb.db, "update").mockImplementationOnce(() => {
      throw { code: DbErrorCode.ConnectionFailure };
    });

    const response = await postRequest(app, "v1/user/username", {
      username: "newusername",
    });

    expect(response.status).toBe(500);

    const result = await response.json();
    expect(result).toEqual({ error: "Unknown error updating username." });
  });
});
