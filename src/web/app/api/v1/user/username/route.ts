import { db, eq } from "@/db";
import { checkDbError, DbError, DbErrorCode } from "@/db/errors";
import { profiles } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { createLogger } from "@/utils/logger";
import { usernameError } from "@/utils/username";

const log = createLogger("api/v1/user/username");

export interface UpdateUsernameResponse {
  updatedUsername?: string;
}

// TODO(kim): Add authentication to API routes.
/*
 * POST /api/v1/user/username
 * body:
 *   - userId (string) - ID of current user
 *   - username (string) - new username to set for user
 */
export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateUsernameResponse>> {
  try {
    const { userId, username: newUsername } = await request.json();

    if (!userId || !newUsername) {
      return APIResponseJSON(
        { error: "User ID and username are required." },
        { status: 400 },
      );
    }

    // Validate the new username
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
    const updatedUser = await db
      .update(profiles)
      .set({ username: newUsername })
      .where(eq(profiles.userId, userId))
      .returning({ updatedUsername: profiles.username });

    if (!updatedUser.length) {
      log.error("Failed to update username.");
      return APIResponseJSON(
        { error: "Failed to update username." },
        { status: 500 },
      );
    }

    // Return the updated username
    return APIResponseJSON({
      updatedUsername: updatedUser[0].updatedUsername,
    });
  } catch (error) {
    if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
      return APIResponseJSON(
        { error: "Username already in use." },
        { status: 400 },
      );
    }
    log.error("Error updating username:", error);
    return APIResponseJSON(
      { error: "Unknown error updating username." },
      { status: 500 },
    );
  }
}
