import { and, eq, getDb } from "@api/db";
import { profiles } from "@api/db/schema";
import { APIResponse } from "@api/utils/api";
import { Context } from "hono";

type ProfileResult =
  | { error: APIResponse<{ error: string }>; profile?: never }
  | {
      error?: never;
      profile: Pick<
        typeof profiles.$inferSelect,
        | "id"
        | "userId"
        | "username"
        | "colorScheme"
        | "displayFont"
        | "displayFontSize"
        | "analyticsTracking"
        | "public"
      >;
    };

export async function checkUserProfile(
  c: Context,
  userId?: string | null,
): Promise<ProfileResult> {
  if (!userId) {
    return {
      error: c.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const results = await getDb(c)
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
    .where(and(eq(profiles.userId, userId), eq(profiles.isEnabled, true)))
    .limit(1);
  if (!results || results.length === 0) {
    return {
      error: c.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { profile: results[0] };
}
