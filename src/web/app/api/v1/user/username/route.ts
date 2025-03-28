import { db, eq } from "@web/db";
import { checkDbError, DbError, DbErrorCode } from "@web/db/errors";
import { profiles } from "@web/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@web/utils/api";
import { checkUserProfile, parseAPIRequest } from "@web/utils/api/server";
import { createLogger } from "@web/utils/logger";
import { usernameError } from "@web/utils/username";

import {
  UpdateUsernameRequestSchema,
  UpdateUsernameResponse,
  UpdateUsernameResponseSchema,
} from "./validation";

const log = createLogger("api/v1/user/username");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateUsernameResponse>> {
  const userId = request.headers.get("x-user-id");

  try {
    const profileResult = await checkUserProfile(userId);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdateUsernameResponse>;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdateUsernameRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { username: newUsername } = data;

    // Check that the new username is valid
    const errorMessage = usernameError(newUsername);
    if (errorMessage) {
      return APIResponseJSON(
        {
          error: errorMessage,
        },
        { status: 400 },
      );
    }

    // Update the username in the database
    const updates = await db
      .update(profiles)
      .set({ username: newUsername })
      .where(userId ? eq(profiles.userId, userId) : undefined)
      .returning({ updatedUsername: profiles.username });

    if (!updates.length) {
      log.error(`Failed to update username for user ${userId}.`);
      return APIResponseJSON(
        { error: "Failed to update username." },
        { status: 500 },
      );
    }
    // Return the updated username
    const response: UpdateUsernameResponse = UpdateUsernameResponseSchema.parse(
      updates[0],
    );
    return APIResponseJSON(response);
  } catch (error) {
    if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
      return APIResponseJSON(
        { error: "Username already in use." },
        { status: 400 },
      );
    }
    log.error(`Error updating username for user ${userId}:`, error);
    return APIResponseJSON(
      { error: "Unknown error updating username." },
      { status: 500 },
    );
  }
}
