import { APIRequest } from "@/utils/api";

export const makeMockRequest = (
  requestBody: Record<string, unknown>,
): APIRequest => {
  const mockRequest = {
    json: jest.fn().mockResolvedValue(requestBody),
  } as unknown as APIRequest;
  return mockRequest;
};
