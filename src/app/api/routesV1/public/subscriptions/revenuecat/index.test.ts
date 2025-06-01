import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import type { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  DEFAULT_TEST_USER_ID,
  DEFAULT_TEST_USER_ID_2,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { MOCK_ENV } from "@app/api/utils/test/env";
import { testDb } from "@app/api/utils/test/provider";
import {
  RevenueCatEnvironment,
  RevenueCatEventType,
  type RevenueCatEventTypeEnum,
  RevenueCatStore,
  type RevenueCatWebhookRequest,
  type RevenueCatWebhookResponse,
} from "@app/schemas/v1/public/subscriptions/revenuecat";
import type { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { revenuecatRouter } from "./index";

// Mock the Web Crypto API for tests
if (!globalThis.crypto) {
  // Mock implementation of importKey that returns a simple key object
  const mockImportKey = vi.fn().mockImplementation(async (_, keyData) => {
    return {
      algorithm: { name: "HMAC", hash: "SHA-256" },
      keyData: keyData,
    };
  });

  // Mock implementation of verify that always returns true for testing
  const mockVerify = vi.fn().mockResolvedValue(true);

  // Mock implementation of sign that generates a deterministic signature for testing
  const mockSign = vi.fn().mockImplementation(async (_, key, data) => {
    const keyBytes = new Uint8Array(key.keyData);
    const dataBytes = new Uint8Array(data);

    // Simple XOR-based hash for testing
    const result = new Uint8Array(32); // SHA-256 produces 32 bytes
    for (let i = 0; i < result.length; i++) {
      result[i] =
        keyBytes[i % keyBytes.length] ^ dataBytes[i % dataBytes.length];
    }
    return result.buffer;
  });

  globalThis.crypto = {
    subtle: {
      importKey: mockImportKey,
      verify: mockVerify,
      sign: mockSign,
    } as unknown as Crypto["subtle"],
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
      if (!array) return array;
      const buffer = new Uint8Array(
        array.buffer,
        array.byteOffset,
        array.byteLength,
      );
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomUUID: (): `${string}-${string}-${string}-${string}-${string}` =>
      "123e4567-e89b-12d3-a456-426614174000",
  };
}

describe("/v1/public/subscriptions/revenuecat", () => {
  let app: Hono<EnvBindings>;

  beforeAll(() => {
    app = setUpMockApp(
      "/v1/public/subscriptions/revenuecat",
      revenuecatRouter,
      null,
    );
  });

  beforeEach(async () => {
    await testDb.db
      .update(profiles)
      .set({
        isPremium: true,
        premiumExpiresAt: new Date(Date.now() + 60 * 60 * 1000 * 24 * 30),
      })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
    await testDb.db
      .update(profiles)
      .set({
        isPremium: false,
        premiumExpiresAt: null,
      })
      .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID_2));
  });

  const createTestWebhookEvent = (
    type: RevenueCatEventTypeEnum,
    eventOverrides: Partial<RevenueCatWebhookRequest["event"]> = {},
    userId: string = DEFAULT_TEST_USER_ID,
  ): RevenueCatWebhookRequest => {
    const baseEvent: RevenueCatWebhookRequest = {
      api_version: "1.0",
      event_timestamp_ms: Date.now(),
      environment: RevenueCatEnvironment.enum.PRODUCTION,
      user_id: "test-user-id",
      app_id: "com.example.app",
      app_user_id: userId,
      event: {
        id: `event_${Math.random().toString(36).substring(7)}`,
        type,
        app_user_id: userId,
        product_id: "premium_monthly",
        price: 9.99,
        currency: "USD",
        store: RevenueCatStore.enum.APP_STORE,
        environment: RevenueCatEnvironment.enum.PRODUCTION,
        period_type: "NORMAL",
        purchased_at_ms: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        expiration_at_ms: Date.now() + 1000 * 60 * 60 * 24 * 60, // 60 days from now
        is_trial_conversion: false,
        original_transaction_id: `orig_${Math.random().toString(36).substring(7)}`,
        event_timestamp_ms: Date.now(),
        ...eventOverrides,
      },
    };

    return baseEvent;
  };

  // Helper function to sign a webhook payload matching RevenueCat's format
  const signWebhookPayload = async (
    payload: unknown,
    secret: string,
  ): Promise<string> => {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const data = `t=${timestamp}.${payloadString}`;

    // Import the key
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Sign the data
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data),
    );

    // Convert the signature to a hex string
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureHex = signatureArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `t=${timestamp},v1=${signatureHex}`;
  };

  // Helper function to make requests with a properly signed payload
  const postWithSignature = async (
    path: string,
    body: RevenueCatWebhookRequest,
    secret: string = MOCK_ENV.REVENUECAT_WEBHOOK_SECRET,
  ): Promise<Response> => {
    const signature = await signWebhookPayload(body, secret);
    return postRequest(app, path, body, {
      "revenuecat-signature": signature,
    });
  };

  it("should handle INITIAL_PURCHASE event", async () => {
    const event = createTestWebhookEvent(
      RevenueCatEventType.enum.INITIAL_PURCHASE,
      {
        is_trial_conversion: true,
        original_transaction_id: "test_original_tx",
      },
      DEFAULT_TEST_USER_ID_2,
    );

    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
    );
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(true);
    expect(profile?.premiumExpiresAt).toBeDefined();
  });

  it("should handle RENEWAL event", async () => {
    const originalProfile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, DEFAULT_TEST_USER_ID),
    });
    const event = createTestWebhookEvent(RevenueCatEventType.enum.RENEWAL, {
      original_transaction_id: "test_original_tx",
    });

    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
    );
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(true);
    expect(profile?.premiumExpiresAt).toBeDefined();
    expect(
      profile?.premiumExpiresAt &&
        (profile?.premiumExpiresAt as Date).getTime() >
          (originalProfile?.premiumExpiresAt as Date).getTime(),
    ).toBe(true);
  });

  it("should handle CANCELLATION event", async () => {
    const event = createTestWebhookEvent(
      RevenueCatEventType.enum.CANCELLATION,
      {
        original_transaction_id: "test_original_tx",
      },
    );

    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
    );
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(true);
    expect(profile?.premiumExpiresAt).toBeDefined();
  });

  it("should handle EXPIRATION event", async () => {
    const event = createTestWebhookEvent(RevenueCatEventType.enum.EXPIRATION, {
      original_transaction_id: "test_original_tx",
    });

    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
    );
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(false);
    expect(profile?.premiumExpiresAt).toBeNull();
  });

  it("should handle UNCANCELLATION event", async () => {
    const originalProfile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, DEFAULT_TEST_USER_ID),
    });
    const event = createTestWebhookEvent(
      RevenueCatEventType.enum.UNCANCELLATION,
      {
        original_transaction_id: "test_original_tx",
      },
    );

    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
    );
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(true);
    expect(profile?.premiumExpiresAt).toBeDefined();
    expect(
      profile?.premiumExpiresAt &&
        (profile?.premiumExpiresAt as Date).getTime() >
          (originalProfile?.premiumExpiresAt as Date).getTime(),
    ).toBe(true);
  });

  it("should handle SUBSCRIPTION_PAUSED event", async () => {
    const event = createTestWebhookEvent(
      RevenueCatEventType.enum.SUBSCRIPTION_PAUSED,
      {
        original_transaction_id: "test_original_tx",
      },
    );

    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
    );
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, DEFAULT_TEST_USER_ID),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(false);
    expect(profile?.premiumExpiresAt).toBeNull();
  });

  it("should handle PRODUCT_CHANGE event", async () => {
    const originalProfile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, DEFAULT_TEST_USER_ID),
    });
    const newProductId = "premium_yearly";
    const event = createTestWebhookEvent(
      RevenueCatEventType.enum.PRODUCT_CHANGE,
      {
        original_transaction_id: "test_original_tx",
        new_product_id: newProductId,
      },
    );

    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
    );
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(true);
    expect(profile?.premiumExpiresAt).toBeDefined();
    expect(
      profile?.premiumExpiresAt &&
        (profile?.premiumExpiresAt as Date).getTime() >
          (originalProfile?.premiumExpiresAt as Date).getTime(),
    ).toBe(true);
  });

  it("should return 400 for invalid webhook payload", async () => {
    const signature = await signWebhookPayload(
      { invalid: "payload" },
      MOCK_ENV.REVENUECAT_WEBHOOK_SECRET,
    );

    const response = await postRequest(
      app,
      "v1/public/subscriptions/revenuecat",
      {
        invalid: "payload",
      },
      {
        "revenuecat-signature": signature,
      },
    );

    expect(response.status).toBe(400);

    const data: { error: string } = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Invalid request parameters");
  });

  it("should return 401 for invalid signature", async () => {
    const event = createTestWebhookEvent(
      RevenueCatEventType.enum.INITIAL_PURCHASE,
    );

    const invalidSecret = "invalid_secret" + Date.now();
    const response = await postWithSignature(
      "v1/public/subscriptions/revenuecat",
      event,
      invalidSecret,
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      message: "Invalid signature",
    });
  });
});
