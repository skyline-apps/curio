import { db, eq } from "@/db";
import { profiles } from "@/db/schema";
import { APIResponse, APIResponseJSON } from "@/utils/api";

type ProfileResult =
  | { error: APIResponse<{ error: string }>; profile?: never }
  | { error?: never; profile: typeof profiles.$inferSelect };

export async function checkUserProfile(
  userId: string | null,
): Promise<ProfileResult> {
  if (!userId) {
    return {
      error: APIResponseJSON({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile || profile.length === 0) {
    return {
      error: APIResponseJSON({ error: "Profile not found." }, { status: 404 }),
    };
  }

  return { profile: profile[0] };
}
