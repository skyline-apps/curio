import { and, eq } from "@app/api/db";
import { checkDbError, DbError, DbErrorCode } from "@app/api/db/errors";
import { apiKeys, profiles } from "@app/api/db/schema";
import { createClient, User } from "@app/api/lib/supabase/client";
import { EnvContext } from "@app/api/utils/env";
import { createMiddleware } from "hono/factory";

const returnDefault = async (
  c: EnvContext,
  next: () => Promise<Response | void>,
): Promise<Response | void> => {
  if (c.get("authOptional")) {
    c.set("userId", undefined);
    c.set("profileId", undefined);
    return await next();
  } else {
    const message = "Authentication required.";
    return c.json({ error: "Unauthorized", message }, 401);
  }
};

export const authMiddleware = createMiddleware(
  async (
    c: EnvContext,
    next: () => Promise<Response | void>,
  ): Promise<Response | void> => {
    const log = c.get("log");
    try {
      // Check if API key is provided for API routes
      const apiKey = c.req.header("x-api-key");

      const db = c.get("db");
      // Handle API routes with API key
      if (apiKey) {
        const profile = await db
          .select({ userId: profiles.userId, profileId: profiles.id })
          .from(profiles)
          .innerJoin(apiKeys, eq(apiKeys.profileId, profiles.id))
          .where(
            and(
              eq(apiKeys.key, apiKey),
              eq(apiKeys.isActive, true),
              eq(profiles.isEnabled, true),
            ),
          );

        if (!profile || profile.length === 0) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Update last used timestamp
        await db
          .update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.key, apiKey));
        c.set("userId", profile[0]?.userId);
        c.set("profileId", profile[0]?.profileId);
        await next();
        return;
      }

      const supabase = await createClient(c);
      const authHeader = c.req.header("Authorization");

      let user: User | null = null;
      let authError: Error | null = null;

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data, error: bearerError } = await supabase.auth.getUser(token);
        user = data.user;
        authError = bearerError;
      } else {
        const { data, error: cookieError } = await supabase.auth.getUser();
        user = data.user;
        authError = cookieError;

        if (user && !authError) {
          const { data: sessionData, error: sessionRetrievalError } =
            await supabase.auth.getSession();
          if (sessionData.session && !sessionRetrievalError) {
            // Re-setting the session with the existing session object.
            // The Supabase SSR client (e.g., @supabase/ssr) when properly configured
            // in `createClient` should handle re-issuing the Set-Cookie headers
            // for the access and refresh tokens. This effectively "extends"
            // their lifetime in the browser by refreshing their Max-Age/Expires attributes.
            await supabase.auth.setSession(sessionData.session);
          } else if (sessionRetrievalError) {
            log.warn(
              "AuthMiddleware: Failed to retrieve session for explicit extension.",
              {
                error: sessionRetrievalError.message,
              },
            );
            // Continue, as authentication (getUser) might have succeeded.
          }
        }
      }

      // If authentication failed or no user email is present
      if (authError || !user?.email) {
        return returnDefault(c, next);
      }

      // Check/create profile in DB (existing logic)
      const profileResult = await db
        .select({ id: profiles.id, isEnabled: profiles.isEnabled })
        .from(profiles)
        .where(eq(profiles.userId, user.id))
        .limit(1);

      const profile = profileResult[0];

      if (!profile || !profile.isEnabled) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      c.set("userId", user.id);
      c.set("profileId", profile.id);

      return await next();
    } catch (error) {
      if (checkDbError(error as DbError) === DbErrorCode.ConnectionFailure) {
        return c.json({ error: "Error connecting to database" }, 500);
      }
      log.error("Unknown error authenticating", { error });
      return c.json({ error: "Error authenticating" }, 500);
    }
  },
);
