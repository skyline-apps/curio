import { and, eq, type PgColumn, type SelectedFields } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import {
  GetSettingsRequest,
  GetSettingsRequestSchema,
  GetSettingsResponse,
  GetSettingsResponseSchema,
  UpdateSettingsRequest,
  UpdateSettingsRequestSchema,
  UpdateSettingsResponse,
  UpdateSettingsResponseSchema,
} from "@app/schemas/v1/user/settings";
import { Hono } from "hono";

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
        const db = c.get("db");
        const profileResult = await db
          .select({
            id: profiles.id,
            userId: profiles.userId,
            username: profiles.username,
            colorScheme: profiles.colorScheme,
            displayFont: profiles.displayFont,
            displayFontSize: profiles.displayFontSize,
            analyticsTracking: profiles.analyticsTracking,
            public: profiles.public,
          })
          .from(profiles)
          .where(
            and(eq(profiles.userId, userId!), eq(profiles.isEnabled, true)),
          )
          .limit(1);
        if (!profileResult || profileResult.length === 0) {
          return c.json({ error: "Unauthorized" }, 401);
        }
        const settings = GetSettingsResponseSchema.parse(profileResult[0]);
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
        const db = c.get("db");
        const updates = await db
          .update(profiles)
          .set({ ...settings })
          .where(eq(profiles.userId, userId!))
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
