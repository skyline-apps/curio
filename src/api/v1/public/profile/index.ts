import { and, desc, eq, sql } from "@api/db";
import { fetchOwnItemResults } from "@api/db/dal/profileItems";
import { profileItems, profiles } from "@api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { ItemResultSchema, PublicItemResultSchema } from "@shared/v1/items";
import {
  GetProfileRequest,
  GetProfileRequestSchema,
  GetProfileResponse,
  GetProfileResponseSchema,
} from "@shared/v1/public/profile";
import { Hono } from "hono";

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
    const userProfileId = c.get("profileId");
    const { username, limit, cursor } = c.req.valid("query");
    try {
      const db = c.get("db");
      const profile = await db.query.profiles.findFirst({
        where: and(
          eq(profiles.username, username),
          eq(profiles.isEnabled, true),
        ),
      });

      if (!profile) {
        return c.json({ error: "Profile not found" }, 404);
      }

      const isOwner = userProfileId && profile.id === userProfileId;

      // Check if user has access to view the profile
      const canView =
        profile.public || (userProfileId && profile.id === userProfileId);

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
