import { EnvBindings } from "@api/utils/env";
import { Hono, MiddlewareHandler } from "hono";

export const DEFAULT_TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174002";
export const DEFAULT_TEST_USER_ID_2 = "123e4567-e89b-12d3-a456-426614174004";
export const DEFAULT_TEST_PROFILE_ID = "123e4567-e89b-12d3-a456-426614174000";
export const DEFAULT_TEST_PROFILE_ID_2 = "123e4567-e89b-12d3-a456-426614174001";
export const DEFAULT_TEST_USERNAME = "defaultuser";
export const DEFAULT_TEST_USERNAME_2 = "defaultuser2";

export const createMockAuthMiddleware = (
  userId: string,
): MiddlewareHandler<EnvBindings> => {
  return async (c, next) => {
    c.set("userId", userId);
    await next();
  };
};

export const getRequest = async (
  app: Hono<EnvBindings>,
  endpoint: string,
  params?: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<Response> => {
  return await app.request(
    `${endpoint}${params ? `?${new URLSearchParams(params).toString()}` : ""}`,
    {
      method: "GET",
    },
  );
};

export const postRequest = async (
  app: Hono<EnvBindings>,
  endpoint: string,
  body?: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<Response> => {
  return await app.request(`${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};
