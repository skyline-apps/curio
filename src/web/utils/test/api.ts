import type { APIRequest } from "@/utils/api";

export type MockRequestOptions = {
  url?: string;
  headers?: Record<string, string>;
  method?: string;
  searchParams?: Record<string, string>;
};

export type RequestBody = Record<string, unknown> | undefined;

export const makeMockRequest = (
  body?: RequestBody,
  options: MockRequestOptions = {},
): APIRequest => {
  const { headers = {}, method = "POST", searchParams = {} } = options;
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

  return request;
};

export const makeAuthenticatedMockRequest = (
  body?: RequestBody,
  options: MockRequestOptions = {},
): APIRequest => {
  const headers = {
    ...options.headers,
    "x-user-id": "test-user-id",
  };

  return makeMockRequest(body, { ...options, headers });
};

export const makeUnauthenticatedMockRequest = (
  body?: RequestBody,
  options: MockRequestOptions = {},
): APIRequest => {
  return makeMockRequest(body, options);
};
