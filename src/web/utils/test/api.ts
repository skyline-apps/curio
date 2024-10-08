import { APIRequest } from "@/utils/api";

export const makeMockRequest = (
  requestBody: Record<string, unknown>,
  headers?: Record<string, string>,
): APIRequest => {
  const mockHeaders = new Headers(headers);

  const mockRequest = {
    json: jest.fn().mockResolvedValue(requestBody),
    headers: mockHeaders,
  } as unknown as APIRequest;

  return mockRequest;
};

export const makeAuthenticatedMockRequest = (
  requestBody: Record<string, unknown>,
  headers?: Record<string, string>,
): APIRequest => {
  const mockHeaders = new Headers({ "x-user-id": "user123", ...headers });

  const mockRequest = {
    json: jest.fn().mockResolvedValue(requestBody),
    headers: mockHeaders,
  } as unknown as APIRequest;

  return mockRequest;
};
