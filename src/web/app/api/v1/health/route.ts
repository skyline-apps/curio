import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";

import { HealthResponse } from "./validation";

/** @no-request */
export async function GET(
  _request: APIRequest,
): Promise<APIResponse<HealthResponse>> {
  try {
    return APIResponseJSON({
      healthy: true,
    });
  } catch (error) {
    return APIResponseJSON({ healthy: false }, { status: 500 });
  }
}
