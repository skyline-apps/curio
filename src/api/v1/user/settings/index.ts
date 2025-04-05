import { eq, getDb, type PgColumn, type SelectedFields } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import { profiles } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  GetSettingsRequest,
  GetSettingsRequestSchema,
  GetSettingsResponse,
  GetSettingsResponseSchema,
  UpdateSettingsRequest,
  UpdateSettingsRequestSchema,
  UpdateSettingsResponse,
  UpdateSettingsResponseSchema,
} from "./validation";

type ProfileKey = keyof typeof profiles;

export const userSettingsRouter = new Hono<EnvBindings>()
  .get(
    "/",
    describeRoute(
      apiDoc("get", GetSettingsRequestSchema, GetSettingsResponseSchema),
    ),
    zValidator(
      "query",
      GetSettingsRequestSchema,
      parseError<GetSettingsRequest, GetSettingsResponse>,
    ),
    async (c): Promise<APIResponse<GetSettingsResponse>> => {
      const userId = c.get("userId");
      try {
        const profileResult = await checkUserProfile(c, userId);
        if (profileResult.error) {
          return profileResult.error;
        }
        const settings = GetSettingsResponseSchema.parse(profileResult.profile);
        return c.json(settings);
      } catch (error) {
        log(
          `Database connection error fetching settings for user ${userId}`,
          error,
        );
        return c.json({ error: "Error fetching settings." }, 500);
      }
    },
  )
  .post(
    "/",
    describeRoute(
      apiDoc("post", UpdateSettingsRequestSchema, UpdateSettingsResponseSchema),
    ),
    zValidator(
      "json",
      UpdateSettingsRequestSchema,
      parseError<UpdateSettingsRequest, UpdateSettingsResponse>,
    ),
    async (c): Promise<APIResponse<UpdateSettingsResponse>> => {
      const userId = c.get("userId");
      try {
        const profileResult = await checkUserProfile(c, userId);
        if (profileResult.error) {
          return profileResult.error;
        }

        const settings = c.req.valid("json");
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
        const db = getDb(c);

        const updates = await db
          .update(profiles)
          .set({ ...settings })
          .where(eq(profiles.userId, profileResult.profile.userId))
          .returning(returnFields);

        if (!updates.length) {
          return c.json({ error: "No settings updated." }, 200);
        }

        const response: UpdateSettingsResponse =
          UpdateSettingsResponseSchema.parse(updates[0]);
        return c.json(response);
      } catch (error) {
        log(`Error updating settings for user ${userId}`, error);
        return c.json({ error: "Error updating settings." }, 500);
      }
    },
  );
