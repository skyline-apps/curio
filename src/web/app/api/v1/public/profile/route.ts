import {
  ItemResultSchema,
  PublicItemResultSchema,
} from "@/app/api/v1/items/validation";
import { and, db, desc, eq, sql } from "@/db";
import { fetchOwnItemResults } from "@/db/queries";
import { profileItems, profiles } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  GetProfileRequestSchema,
  GetProfileResponse,
  GetProfileResponseSchema,
} from "./validation";

const log = createLogger("api/v1/profile");

export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetProfileResponse>> {
  const userId = request.headers.get("x-user-id");
  const url = new URL(request.url);
  const data = await parseAPIRequest(
    GetProfileRequestSchema,
    Object.fromEntries(url.searchParams),
  );
  if ("error" in data) {
    return data.error;
  }

  try {
    const profileResult = await checkUserProfile(userId, null);
    const userProfile = profileResult.profile;

    const { username, limit, cursor } = data;
    const profile = await db.query.profiles.findFirst({
      where: and(eq(profiles.username, username), eq(profiles.isEnabled, true)),
    });

    if (!profile) {
      return APIResponseJSON({ error: "Profile not found" }, { status: 404 });
    }

    const isOwner = userProfile && profile.id === userProfile.id;

    // Check if user has access to view the profile
    const canView =
      profile.public || (userProfile && profile.id === userProfile.id);

    if (!canView) {
      return APIResponseJSON({ error: "Profile not found" }, { status: 404 });
    }

    let whereClause = and(
      eq(profileItems.profileId, profile.id),
      eq(profileItems.isFavorite, true),
    );

    if (cursor) {
      whereClause = and(whereClause, sql`${profileItems.savedAt} < ${cursor}`);
    }

    const favoriteItems = await fetchOwnItemResults()
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

    return APIResponseJSON(response);
  } catch (error) {
    log.error(`Error fetching profile for username ${data.username}`, error);
    return APIResponseJSON(
      { error: "Error fetching profile." },
      { status: 500 },
    );
  }
}
