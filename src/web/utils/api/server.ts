import { and, db, eq } from "@web/db";
import { profiles } from "@web/db/schema";
import { ZodType } from "zod";

import { APIResponse, APIResponseJSON } from "./index";

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
  userId: string | null,
): Promise<ProfileResult> {
  if (!userId) {
    return {
      error: APIResponseJSON({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const results = await db
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
