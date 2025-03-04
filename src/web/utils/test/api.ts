import type { APIRequest } from "@/utils/api";

export const DEFAULT_TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174002";
export const DEFAULT_TEST_USER_ID_2 = "123e4567-e89b-12d3-a456-426614174004";
export const DEFAULT_TEST_PROFILE_ID = "123e4567-e89b-12d3-a456-426614174000";
export const DEFAULT_TEST_PROFILE_ID_2 = "123e4567-e89b-12d3-a456-426614174001";
export const DEFAULT_TEST_USERNAME = "defaultuser";
export const DEFAULT_TEST_USERNAME_2 = "defaultuser2";

export type MockRequestOptions = {
  url?: string;
  headers?: Record<string, string>;
  method?: string;
  searchParams?: Record<string, string>;
  userId?: string;
  body?: RequestBody;
};

export type RequestBody = Record<string, unknown> | undefined;

export const makeMockRequest = (
  options: MockRequestOptions = {},
): APIRequest => {
  const { headers = {}, method = "POST", searchParams = {}, body } = options;
  let { url = "http://localhost" } = options;

  // Add search params to URL for GET requests
  if (method === "GET" && Object.keys(searchParams).length > 0) {
    const urlObj = new URL(url);
    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });
    url = urlObj.toString();
  }

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body);
  }

  const request = new Request(url, requestInit) as APIRequest;

  // Add a mock json method for GET requests
  if (method === "GET" && body) {
    request.json = async () => body;
  }

  // Add a mock json method for POST requests
  if (method === "POST" && body) {
    request.json = async () => body;
  }

  return request;
};

export const makeAuthenticatedMockRequest = (
  options: MockRequestOptions = {},
): APIRequest => {
  const headers = { ...options.headers };

  headers["x-user-id"] = options.userId ?? DEFAULT_TEST_USER_ID;

  return makeMockRequest({ ...options, headers });
};

export const makeUnauthenticatedMockRequest = (
  options: MockRequestOptions = {},
): APIRequest => {
  return makeMockRequest(options);
};
