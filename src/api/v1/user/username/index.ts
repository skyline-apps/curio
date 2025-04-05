import { eq } from "@api/db";
import { checkDbError, DbError, DbErrorCode } from "@api/db/errors";
import { profiles } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { usernameError } from "@api/utils/username";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  UpdateUsernameRequest,
  UpdateUsernameRequestSchema,
  UpdateUsernameResponse,
  UpdateUsernameResponseSchema,
} from "./validation";

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
        log(`Failed to update username for user ${profileId}.`);
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
      log(`Error updating username for user ${profileId}:`, error);
      return c.json({ error: "Unknown error updating username." }, 500);
    }
  },
);
