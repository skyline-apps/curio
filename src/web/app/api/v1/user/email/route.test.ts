import { describe, expect, it, vi } from "vitest";

import { db, eq } from "@/db";
import { profiles } from "@/db/schema";
import {
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@/utils/test/api";

import { POST } from "./route";

// Mock the email module before any other imports
vi.mock("@/lib/email", async () => {
  const actual = await vi.importActual("@/lib/email");
  return {
    ...actual,
    CURIO_EMAIL_DOMAIN: "testmail.curi.ooo",
  };
});

describe("POST /api/v1/user/email", () => {
  it("should generate and set a random newsletter email for user", async () => {
    const request = makeAuthenticatedMockRequest({
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updatedNewsletterEmail).toMatch(
      /^[a-z]{24}@testmail\.curi\.ooo$/,
    );

    const myProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID))
      .limit(1);
    expect(myProfile[0].newsletterEmail).toBe(data.updatedNewsletterEmail);
  });

  it("should overwrite the existing email", async () => {
    const existingEmail = await db
      .update(profiles)
      .set({ newsletterEmail: "existing@testmail.curi.ooo" })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID))
      .returning({ newsletterEmail: profiles.newsletterEmail });

    const request = makeAuthenticatedMockRequest({
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updatedNewsletterEmail).toMatch(
      /^[a-z]{24}@testmail\.curi\.ooo$/,
    );

    const myProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID))
      .limit(1);
    expect(myProfile[0].newsletterEmail).toBe(data.updatedNewsletterEmail);
    expect(myProfile[0].newsletterEmail).not.toBe(
      existingEmail[0].newsletterEmail,
    );
  });

  it("should return 401 for unauthenticated request", async () => {
    const request = makeUnauthenticatedMockRequest({
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });
});
