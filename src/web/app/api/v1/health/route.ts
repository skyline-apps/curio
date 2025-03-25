import { APIRequest, APIResponse, APIResponseJSON } from "@web/utils/api";

import { HealthResponse, HealthResponseSchema } from "./validation";

/** @no-request */
export async function GET(
  _request: APIRequest,
): Promise<APIResponse<HealthResponse>> {
  try {
    const response: HealthResponse = HealthResponseSchema.parse({
      healthy: true,
    });
    return APIResponseJSON(response);
  } catch (error) {
    return APIResponseJSON({ healthy: false }, { status: 500 });
  }
}
