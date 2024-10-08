import { z } from "zod";

import { db, eq } from "@/db";
import { checkDbError, DbError, DbErrorCode } from "@/db/errors";
import { profiles } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { createLogger } from "@/utils/logger";
import { usernameError } from "@/utils/username";

const log = createLogger("api/v1/user/username");

const UpdateUsernameRequestSchema = z.object({
  username: z.string(),
});

export interface UpdateUsernameResponse {
  updatedUsername?: string;
}

// TODO(kim): Add authentication to API routes.
export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateUsernameResponse>> {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return APIResponseJSON({ error: "Unauthorized." }, { status: 401 });
    }

    const data = await request.json();

    const parsed = UpdateUsernameRequestSchema.safeParse(data);
    if (!parsed.success) {
      return APIResponseJSON(
        { error: "Username is required." },
        { status: 400 },
      );
    }

    const { username: newUsername } = parsed.data;

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
