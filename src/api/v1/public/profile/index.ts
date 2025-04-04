import { and, desc, eq, getDb, sql } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import { fetchOwnItemResults } from "@api/db/dal/profileItems";
import { profileItems, profiles } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import {
  ItemResultSchema,
  PublicItemResultSchema,
} from "@api/v1/items/validation";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  GetProfileRequest,
  GetProfileRequestSchema,
  GetProfileResponse,
  GetProfileResponseSchema,
} from "./validation";

export const publicProfileRouter = new Hono<EnvBindings>().get(
  "/",
  describeRoute(
    apiDoc("get", GetProfileRequestSchema, GetProfileResponseSchema),
  ),
  zValidator(
    "query",
    GetProfileRequestSchema,
    parseError<GetProfileRequest, GetProfileResponse>,
  ),
  async (c): Promise<APIResponse<GetProfileResponse>> => {
    const userId = c.get("userId");
    const { username, limit, cursor } = c.req.valid("query");
    try {
      const profileResult = await checkUserProfile(c, userId);
      const userProfile = profileResult.profile;

      const db = getDb(c);
      const profile = await db.query.profiles.findFirst({
        where: and(
          eq(profiles.username, username),
          eq(profiles.isEnabled, true),
        ),
      });

      if (!profile) {
        return c.json({ error: "Profile not found" }, 404);
      }

      const isOwner = userProfile && profile.id === userProfile.id;

      // Check if user has access to view the profile
      const canView =
        profile.public || (userProfile && profile.id === userProfile.id);

      if (!canView) {
        return c.json({ error: "Profile not found" }, 404);
      }

      let whereClause = and(
        eq(profileItems.profileId, profile.id),
        eq(profileItems.isFavorite, true),
      );

      if (cursor) {
        whereClause = and(
          whereClause,
          sql`${profileItems.savedAt} < ${cursor}`,
        );
      }

      const favoriteItems = await fetchOwnItemResults(db)
        .where(and(whereClause))
        .orderBy(desc(profileItems.savedAt))
        .limit(limit);

      const parsedItems = isOwner
        ? favoriteItems.map((item) => ItemResultSchema.parse(item))
        : favoriteItems.map((item) =>
            PublicItemResultSchema.parse({
              ...item,
              labels: [],
              profileItemId: null,
            }),
          );

      const response = GetProfileResponseSchema.parse({
        profile: {
          username: profile.username,
          createdAt: profile.createdAt,
        },
        favoriteItems: parsedItems,
        nextCursor:
          favoriteItems.length === limit
            ? favoriteItems[
                favoriteItems.length - 1
              ].metadata.savedAt?.toISOString() || undefined
            : undefined,
      });

      return c.json(response);
    } catch (error) {
      log(`Error fetching profile for username ${username}`, error);
      return c.json({ error: "Error fetching profile." }, 500);
    }
  },
);
