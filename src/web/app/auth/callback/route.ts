// eslint-disable-next-line no-restricted-imports
import { NextResponse } from "next/server";

import { db, eq } from "@web/db";
import { profiles, SelectProfile } from "@web/db/schema";
import { createLogger } from "@web/utils/logger";
import { createClient, SupabaseClient } from "@web/utils/supabase/server";
import { createUsernameSlug } from "@web/utils/username";

const log = createLogger("auth/callback");

// Create Profile corresponding to new User
async function getOrCreateProfile(
  supabase: SupabaseClient,
): Promise<SelectProfile | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !user.email) {
    return null;
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });
  if (profile) {
    return profile;
  }
  const newProfile = await db
    .insert(profiles)
    .values({ userId: user.id, username: createUsernameSlug(user.email) })
    .returning();
  return newProfile[0];
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const profile = await getOrCreateProfile(supabase);
      if (!profile) {
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=Profile creation failed.`,
        );
      }
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      log.error("Error exchanging code: ", error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=Invalid authentication code.`,
  );
}
