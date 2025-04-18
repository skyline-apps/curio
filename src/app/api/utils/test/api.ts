import { type TransactionDB } from "@app/api/db";
import { EnvBindings } from "@app/api/utils/env";
import { createLogger } from "@app/api/utils/logger";
import { MOCK_ENV } from "@app/api/utils/test/env";
import { testDb } from "@app/api/utils/test/provider";
import { Queue } from "@cloudflare/workers-types";
import { Hono, MiddlewareHandler } from "hono";
import { vi } from "vitest";

export const DEFAULT_TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174002";
export const DEFAULT_TEST_USER_ID_2 = "123e4567-e89b-12d3-a456-426614174004";
export const DEFAULT_TEST_PROFILE_ID = "123e4567-e89b-12d3-a456-426614174000";
export const DEFAULT_TEST_PROFILE_ID_2 = "123e4567-e89b-12d3-a456-426614174001";
export const DEFAULT_TEST_USERNAME = "defaultuser";
export const DEFAULT_TEST_USERNAME_2 = "defaultuser2";

const profileIdMap: Record<string, string> = {
  [DEFAULT_TEST_USER_ID]: DEFAULT_TEST_PROFILE_ID,
  [DEFAULT_TEST_USER_ID_2]: DEFAULT_TEST_PROFILE_ID_2,
};

export const MOCK_QUEUE: Queue = { send: vi.fn(), sendBatch: vi.fn() };

const createMockAuthMiddleware = (
  userId: string,
): MiddlewareHandler<EnvBindings> => {
  return async (c, next) => {
    if (userId) {
      const profileId = profileIdMap[userId];
      c.set("userId", userId);
      c.set("profileId", profileId);
    }
    await next();
  };
};

export const setUpMockApp = (
  route: string,
  router: Hono<EnvBindings>,
  userId: string | null = DEFAULT_TEST_USER_ID,
): Hono<EnvBindings> => {
  const app = new Hono<EnvBindings>();
  if (userId) {
    app.use(createMockAuthMiddleware(userId));
  }
  app.use("*", (c, next) => {
    c.set("log", createLogger(c.env));
    c.set("db", testDb.db as unknown as TransactionDB);
    c.env.ITEMS_FETCHER_QUEUE = MOCK_QUEUE;
    return next();
  });
  app.route(route, router);
  return app;
};

export const getRequest = async (
  app: Hono<EnvBindings>,
  endpoint: string,
  params?: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  headers?: Record<string, string>,
): Promise<Response> => {
  return await app.request(
    `${endpoint}${params ? `?${new URLSearchParams(params).toString()}` : ""}`,
    {
      method: "GET",
      headers: {
        ...(headers ? headers : {}),
      },
    },
    MOCK_ENV,
  );
};

export const postRequest = async (
  app: Hono<EnvBindings>,
  endpoint: string,
  body?: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  headers?: Record<string, string>,
): Promise<Response> => {
  return await app.request(
    `${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers ? headers : {}),
      },
      body: JSON.stringify(body ?? {}),
    },
    MOCK_ENV,
  );
};

export const deleteRequest = async (
  app: Hono<EnvBindings>,
  endpoint: string,
  body?: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  headers?: Record<string, string>,
): Promise<Response> => {
  return await app.request(
    `${endpoint}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(headers ? headers : {}),
      },
      body: JSON.stringify(body ?? {}),
    },
    MOCK_ENV,
  );
};
