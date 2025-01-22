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
    return Promise.resolve({
      error: APIResponseJSON({ error: "Unauthorized." }, { status: 401 }),
    });
  }

  const results = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!results || results.length === 0) {
    return {
      error: APIResponseJSON({ error: "Profile not found." }, { status: 404 }),
    };
  }

  return { profile: results[0] };
}
