import { db, eq, type PgColumn, type SelectedFields } from "@/db";
import { profiles } from "@/db/schema";
import {
  APIRequest,
  APIResponse,
  APIResponseJSON,
  checkUserProfile,
  parseAPIRequest,
} from "@/utils/api";
import { createLogger } from "@/utils/logger";

import {
  type SettingsResponse,
  UpdateableSettingsRequestSchema,
  type UpdatedSettingsResponse,
} from "./validation";

const log = createLogger("api/v1/user/settings");
type ProfileKey = keyof typeof profiles;

/** @no-request */
export async function GET(
  request: APIRequest,
): Promise<APIResponse<SettingsResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdatedSettingsResponse>;
    }
    return APIResponseJSON({
      colorScheme: profileResult.profile.colorScheme,
    });
  } catch (error) {
    log.error(
      `Database connection error fetching settings for user ${userId}`,
      error,
    );
    return APIResponseJSON(
      { error: "Error fetching settings." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdatedSettingsResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdatedSettingsResponse>;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdateableSettingsRequestSchema, body);

    if ("error" in data) {
      return data.error as APIResponse<UpdatedSettingsResponse>;
    }

    const settings = data;
    const settingsKeys = Object.keys(settings);

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

    const updates = await db
      .update(profiles)
      .set({ ...settings })
      .where(eq(profiles.userId, profileResult.profile.userId))
      .returning(returnFields);

    if (!updates.length) {
      return APIResponseJSON(
        { error: "No settings updated." },
        { status: 200 },
      ) as APIResponse<UpdatedSettingsResponse>;
    }
    return APIResponseJSON(updates[0]) as APIResponse<UpdatedSettingsResponse>;
  } catch (error) {
    log.error(`Error updating settings for user ${userId}`, error);
    return APIResponseJSON(
      { error: "Error updating settings." },
      { status: 500 },
    );
  }
}
