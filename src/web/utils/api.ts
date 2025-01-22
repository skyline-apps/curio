// eslint-disable-next-line no-restricted-imports
import { NextRequest, NextResponse } from "next/server";
import { ZodType } from "zod";

import { db, eq } from "@/db";
import { profiles } from "@/db/schema";

export type APIRequest = NextRequest;

interface APIResponseJsonError extends NextResponse {
  error?: string;
}

export type APIResponse<T = unknown> =
  | APIResponseJsonError
  | (NextResponse & T);

export const APIResponseJSON = NextResponse.json;

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.status < 200 || response.status >= 300) {
    const error = await response.json();
    throw new Error(error.error);
  }
  const result = await response.json();
  return result;
}

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
