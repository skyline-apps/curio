import { and, eq } from "@api/db";
import { checkDbError, DbError, DbErrorCode } from "@api/db/errors";
import { apiKeys, profiles } from "@api/db/schema";
import { createClient } from "@api/lib/supabase/client";
import { EnvContext } from "@api/utils/env";
import log from "@api/utils/logger";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(
  async (
    c: EnvContext,
    next: () => Promise<Response | void>,
  ): Promise<Response | void> => {
    try {
      const supabase = createClient(c);

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

      // Get JWT tokens from cookies
      const accessToken = getCookie(c, "sb-access-token");
      const refreshToken = getCookie(c, "sb-refresh-token");

      // Set auth cookies if they exist
      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }

      // Get current user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // If API route but no API key and no user, return 401
      if (!user) {
        if (c.get("authOptional")) {
          await next();
          return;
        }
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [{ id: profileId, isEnabled }] = await db
        .select({ id: profiles.id, isEnabled: profiles.isEnabled })
        .from(profiles)
        .where(eq(profiles.userId, user.id));

      if (!isEnabled) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Set user ID header if user is authenticated
      c.set("userId", user.id);
      c.set("profileId", profileId);

      // Session refresh handling
      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.refreshSession({
            refresh_token: refreshToken,
          });

        if (!sessionError && sessionData.session) {
          // Set refreshed cookies
          setCookie(c, "sb-access-token", sessionData.session.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            path: "/",
          });
          setCookie(c, "sb-refresh-token", sessionData.session.refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            path: "/",
          });
        }
      }

      await next();
    } catch (error) {
      if (checkDbError(error as DbError) === DbErrorCode.ConnectionFailure) {
        return c.json({ error: "Error connecting to database" }, 500);
      }
      log("Error authenticating", error);
      return c.json({ error: "Error authenticating" }, 500);
    }
  },
);
