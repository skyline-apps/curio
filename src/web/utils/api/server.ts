import { ZodType } from "zod";

import { and, db, eq } from "@/db";
import { apiKeys, profiles } from "@/db/schema";

import { APIResponse, APIResponseJSON } from "./index";

type ProfileResult =
  | { error: APIResponse<{ error: string }>; profile?: never }
  | {
      error?: never;
      profile: Pick<
        typeof profiles.$inferSelect,
        "id" | "userId" | "colorScheme" | "username"
      >;
    };

export async function checkUserProfile(
  userId: string | null,
  apiKey: string | null,
): Promise<ProfileResult> {
  if (!userId && !apiKey) {
    return Promise.resolve({
      error: APIResponseJSON({ error: "Unauthorized." }, { status: 401 }),
    });
  }

  let results;

  if (apiKey) {
    results = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        userId: profiles.userId,
        colorScheme: profiles.colorScheme,
      })
      .from(profiles)
      .innerJoin(apiKeys, eq(apiKeys.profileId, profiles.id))
      .where(and(eq(apiKeys.key, apiKey), eq(apiKeys.isActive, true)))
      .limit(1);
    if (results.length > 0) {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.key, apiKey));
    }
  } else if (userId) {
    results = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        userId: profiles.userId,
        colorScheme: profiles.colorScheme,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
  }
  if (!results || results.length === 0) {
    return {
      error: APIResponseJSON({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { profile: results[0] };
}

export async function parseAPIRequest<T extends ZodType>(
  schema: T,
  requestData: NonNullable<unknown>,
): Promise<T["_output"] | { error: APIResponse }> {
  const parsed = schema.safeParse(requestData);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path =
        issue.path.length !== undefined ? issue.path.join(".") : issue.path;
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    const message = errors.join("\n");
    return {
      error: APIResponseJSON(
        { error: `Invalid request parameters:\n${message}` },
        { status: 400 },
      ),
    };
  }
  return parsed.data;
}
