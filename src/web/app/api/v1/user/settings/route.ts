import { db, eq, type PgColumn, type SelectedFields } from "@/db";
import { profiles } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  type SettingsResponse,
  SettingsResponseSchema,
  UpdatedSettingsRequestSchema,
  type UpdatedSettingsResponse,
  UpdatedSettingsResponseSchema,
} from "./validation";

const log = createLogger("api/v1/user/settings");
type ProfileKey = keyof typeof profiles;

/** @no-request */
export async function GET(
  request: APIRequest,
): Promise<APIResponse<SettingsResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdatedSettingsResponse>;
    }
    const settings = SettingsResponseSchema.parse({
      colorScheme: profileResult.profile.colorScheme,
      public: profileResult.profile.public,
    });
    return APIResponseJSON(settings);
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
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdatedSettingsResponse>;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdatedSettingsRequestSchema, body);

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

    const response: UpdatedSettingsResponse =
      UpdatedSettingsResponseSchema.parse(updates[0]);
    return APIResponseJSON(response);
  } catch (error) {
    log.error(`Error updating settings for user ${userId}`, error);
    return APIResponseJSON(
      { error: "Error updating settings." },
      { status: 500 },
    );
  }
}
