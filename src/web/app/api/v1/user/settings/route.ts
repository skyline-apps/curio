import { db, eq, type PgColumn, type SelectedFields } from "@/db";
import { checkDbError, type DbError, DbErrorCode } from "@/db/errors";
import { profiles } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { createLogger } from "@/utils/logger";

import {
  type Settings,
  UpdateableSettingsSchema,
  type UpdatedSettings,
} from "./validation";

const log = createLogger("api/v1/user/settings");
type ProfileKey = keyof typeof profiles;

export async function GET(request: APIRequest): Promise<APIResponse<Settings>> {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return APIResponseJSON({ error: "Unauthorized." }, { status: 401 });
  }

  return db
    .select({ colorScheme: profiles.colorScheme })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .then((results) => {
      if (!results.length) {
        return APIResponseJSON(
          { error: "No settings found for this user." },
          { status: 200 },
        );
      }
      return APIResponseJSON(results[0]);
    })
    .catch((error) => {
      if (checkDbError(error as DbError) !== DbErrorCode.Invalid) {
        log.error(`Database error fetching settings for user ${userId}`, error);
        return APIResponseJSON(
          { error: "Error fetching settings." },
          { status: 500 },
        );
      }
      log.error(`Error fetching settings for user ${userId} `, error);
      return APIResponseJSON(
        { error: "Failed to fetch settings." },
        { status: 500 },
      );
    });
}

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdatedSettings>> {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return APIResponseJSON({ error: "Unauthorized." }, { status: 401 });
  }

  const data = await request.json();
  const parsed = UpdateableSettingsSchema.safeParse(data);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      // issue.path can be either a string or an array, so handle both cases.
      const path =
        issue.path.length !== undefined ? issue.path.join(".") : issue.path;
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    const message = errors.join("\n ");
    return APIResponseJSON(
      { error: `Invalid settings:\n${message}` },
      { status: 400 },
    );
  }

  const settings = parsed.data;
  const settingsKeys = Object.keys(parsed.data);

  // Get the list of settings fields to return.
  const returnFields = settingsKeys.reduce<SelectedFields>((acc, key) => {
    if (key in profiles) {
      const column = profiles[key as ProfileKey];
      // Check if the column is a PgColumn
      if (column && typeof column === "object" && "name" in column) {
        acc[key] = column as PgColumn;
      }
    }
    return acc;
  }, {});

  return db
    .update(profiles)
    .set({ ...settings })
    .where(eq(profiles.userId, userId))
    .returning(returnFields)
    .then((updates) => {
      if (!updates.length) {
        return APIResponseJSON(
          { error: "No settings updated." },
          { status: 200 },
        );
      }
      return APIResponseJSON(updates[0]);
    })
    .catch((error) => {
      if (checkDbError(error as DbError) !== DbErrorCode.Invalid) {
        log.error(`Database error updating settings for user ${userId}`, error);
        return APIResponseJSON(
          { error: "Error updating settings." },
          { status: 500 },
        );
      }
      log.error(`Error updating settings for user ${userId} `, error);
      return APIResponseJSON(
        { error: "Failed to update settings." },
        { status: 500 },
      );
    });
}
