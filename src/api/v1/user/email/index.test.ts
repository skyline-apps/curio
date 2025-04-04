import { eq } from "@api/db";
import { profiles } from "@api/db/schema";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  postRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import { testDb } from "@api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";

import { userEmailRouter } from "./index";
import { UpdateEmailResponse } from "./validation";

describe("POST /v1/user/email", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/user/email", userEmailRouter);
  });

  it("should generate and set a random newsletter email for user", async () => {
    const response = await postRequest(app, "v1/user/email");
    expect(response.status).toBe(200);

    const { updatedNewsletterEmail }: UpdateEmailResponse =
      await response.json();

    expect(updatedNewsletterEmail).toMatch(/^[a-z]{24}@testmail\.curi\.ooo$/);

    const myProfile = await testDb.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID))
      .limit(1);
    expect(myProfile[0].newsletterEmail).toBe(updatedNewsletterEmail);
  });

  it("should overwrite the existing email", async () => {
    const existingEmail = await testDb.db
      .update(profiles)
      .set({ newsletterEmail: "existing@testmail.curi.ooo" })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID))
      .returning({ newsletterEmail: profiles.newsletterEmail });

    const response = await postRequest(app, "v1/user/email");
    const { updatedNewsletterEmail }: UpdateEmailResponse =
      await response.json();

    expect(response.status).toBe(200);
    expect(updatedNewsletterEmail).toMatch(/^[a-z]{24}@testmail\.curi\.ooo$/);

    const myProfile = await testDb.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID))
      .limit(1);
    expect(myProfile[0].newsletterEmail).toBe(updatedNewsletterEmail);
    expect(myProfile[0].newsletterEmail).not.toBe(
      existingEmail[0].newsletterEmail,
    );
  });
});
