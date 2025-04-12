import { eq } from "@app/api/db";
import { checkDbError, DbError, DbErrorCode } from "@app/api/db/errors";
import { profiles } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import { usernameError } from "@app/api/utils/username";
import {
  UpdateUsernameRequest,
  UpdateUsernameRequestSchema,
  UpdateUsernameResponse,
  UpdateUsernameResponseSchema,
} from "@app/schemas/v1/user/username";
import { Hono } from "hono";

export const userUsernameRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", UpdateUsernameRequestSchema, UpdateUsernameResponseSchema),
  ),
  zValidator(
    "json",
    UpdateUsernameRequestSchema,
    parseError<UpdateUsernameRequest, UpdateUsernameResponse>,
  ),
  async (c): Promise<APIResponse<UpdateUsernameResponse>> => {
    const log = c.get("log");
    const profileId = c.get("profileId")!;
    try {
      const { username: newUsername } = c.req.valid("json");

      // Check that the new username is valid
      const errorMessage = usernameError(newUsername);
      if (errorMessage) {
        return c.json(
          {
            error: errorMessage,
          },
          400,
        );
      }
      const db = c.get("db");

      // Update the username in the database
      const updates = await db
        .update(profiles)
        .set({ username: newUsername })
        .where(eq(profiles.id, profileId))
        .returning({ updatedUsername: profiles.username });

      if (!updates.length) {
        log.error(`Failed to update username for user`, { profileId });
        return c.json({ error: "Failed to update username." }, 500);
      }
      // Return the updated username
      const response: UpdateUsernameResponse =
        UpdateUsernameResponseSchema.parse(updates[0]);
      return c.json(response);
    } catch (error) {
      if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
        return c.json({ error: "Username already in use." }, 400);
      }
      log.error(`Error updating username for user`, { profileId, error });
      return c.json({ error: "Unknown error updating username." }, 500);
    }
  },
);
