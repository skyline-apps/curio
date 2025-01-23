import { APIRequest } from "@/utils/api";
import {
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@/utils/test/api";

import { GET } from "./route";

describe("GET /api/v1/health", () => {
  it("should return 200 for authenticated user", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      healthy: true,
    });
  });

  it("should return 200 for unauthenticated user", async () => {
    const request: APIRequest = makeUnauthenticatedMockRequest({
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      healthy: true,
    });
  });
});
