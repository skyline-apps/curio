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
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { revenuecatRouter } from "./index";

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
      event: {
        id: `event_${Math.random().toString(36).substring(7)}`,
        type,
        app_id: "com.example.app",
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

  const postAuthorizedRequest = (
    event: RevenueCatWebhookRequest,
  ): Promise<Response> => {
    return postRequest(app, "v1/public/subscriptions/revenuecat", event, {
      Authorization: `Bearer ${MOCK_ENV.CURIO_APP_SECRET}`,
    });
  };

  it("should handle INITIAL_PURCHASE event", async () => {
    const request = createTestWebhookEvent(
      RevenueCatEventType.enum.INITIAL_PURCHASE,
      {
        is_trial_conversion: true,
        original_transaction_id: "test_original_tx",
      },
      DEFAULT_TEST_USER_ID_2,
    );

    const response = await postAuthorizedRequest(request);
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) =>
        eq(profiles.userId, request.event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(true);
    expect(profile?.premiumExpiresAt).toBeDefined();
  });

  it("should handle RENEWAL event", async () => {
    const originalProfile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, DEFAULT_TEST_USER_ID),
    });
    const request = createTestWebhookEvent(RevenueCatEventType.enum.RENEWAL, {
      original_transaction_id: "test_original_tx",
    });

    const response = await postAuthorizedRequest(request);
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) =>
        eq(profiles.userId, request.event.app_user_id),
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
    const request = createTestWebhookEvent(
      RevenueCatEventType.enum.CANCELLATION,
      {
        original_transaction_id: "test_original_tx",
      },
    );

    const response = await postAuthorizedRequest(request);
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) =>
        eq(profiles.userId, request.event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(true);
    expect(profile?.premiumExpiresAt).toBeDefined();
  });

  it("should handle EXPIRATION event", async () => {
    const request = createTestWebhookEvent(
      RevenueCatEventType.enum.EXPIRATION,
      {
        original_transaction_id: "test_original_tx",
      },
    );

    const response = await postAuthorizedRequest(request);
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) =>
        eq(profiles.userId, request.event.app_user_id),
    });
    expect(profile).toBeDefined();
    expect(profile?.isPremium).toBe(false);
    expect(profile?.premiumExpiresAt).toBeNull();
  });

  it("should handle UNCANCELLATION event", async () => {
    const originalProfile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, DEFAULT_TEST_USER_ID),
    });
    const request = createTestWebhookEvent(
      RevenueCatEventType.enum.UNCANCELLATION,
      {
        original_transaction_id: "test_original_tx",
      },
    );

    const response = await postAuthorizedRequest(request);
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) =>
        eq(profiles.userId, request.event.app_user_id),
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
    const request = createTestWebhookEvent(
      RevenueCatEventType.enum.SUBSCRIPTION_PAUSED,
      {
        original_transaction_id: "test_original_tx",
      },
    );

    const response = await postAuthorizedRequest(request);
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) =>
        eq(profiles.userId, request.event.app_user_id),
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
    const request = createTestWebhookEvent(
      RevenueCatEventType.enum.PRODUCT_CHANGE,
      {
        original_transaction_id: "test_original_tx",
        new_product_id: newProductId,
      },
    );

    const response = await postAuthorizedRequest(request);
    expect(response.status).toBe(200);

    const data: RevenueCatWebhookResponse = await response.json();
    expect(data.success).toBe(true);

    const profile = await testDb.db.query.profiles.findFirst({
      where: (profiles, { eq }) =>
        eq(profiles.userId, request.event.app_user_id),
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

  it("should return 400 for invalid event payload", async () => {
    const response = await postAuthorizedRequest({
      invalid: "payload",
    } as unknown as RevenueCatWebhookRequest);

    expect(response.status).toBe(400);

    const data: { error: string } = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Invalid request parameters");
  });

  it("should return 401 for invalid authorization", async () => {
    const request = createTestWebhookEvent(
      RevenueCatEventType.enum.INITIAL_PURCHASE,
    );

    const invalidSecret = "invalid_secret";
    const response = await postRequest(
      app,
      "v1/public/subscriptions/revenuecat",
      request,
      {
        Authorization: `Bearer ${invalidSecret}`,
      },
    );

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toMatchObject({
      error: "Unauthorized",
    });
  });
});
