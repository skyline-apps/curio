import { and, eq } from "@app/api/db";
import { checkDbError, DbError, DbErrorCode } from "@app/api/db/errors";
import { apiKeys, profiles } from "@app/api/db/schema";
import { createClient } from "@app/api/lib/supabase/client";
import { EnvContext } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { createUsernameSlug } from "@app/api/utils/username";
import { User } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports
import { createMiddleware } from "hono/factory";

type UserWithEmail = User & { email: string };
function isUserWithEmail(user: User): user is UserWithEmail {
  return typeof user.email === "string";
}

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

      const authHeader = c.req.header("Authorization");
      let user: UserWithEmail | null = null;
      let tokenError: string | null = null;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data, error } = await supabase.auth.getUser(token);
        if (error) {
          log(`Bearer token validation failed: ${error.message}`);
          tokenError = error.message;
        } else if (!data?.user) {
          log("Bearer token valid, but no user returned.");
          tokenError = "No user associated with token";
        } else if (!isUserWithEmail(data.user)) {
          log("Bearer token valid, but user has no email.");
          tokenError = "User has no email";
        } else {
          user = data.user;
        }
      } else {
        log("No Bearer token found in Authorization header.");
      }

      if (user) {
        const profileResult = await db
          .select({ id: profiles.id, isEnabled: profiles.isEnabled })
          .from(profiles)
          .where(eq(profiles.userId, user.id))
          .limit(1);

        let profile = profileResult[0];

        if (!profile) {
          const newProfile = await db
            .insert(profiles)
            .values({
              userId: user.id,
              username: createUsernameSlug(user.email),
            })
            .returning({ id: profiles.id, isEnabled: profiles.isEnabled });
          if (!newProfile || newProfile.length === 0) {
            throw new Error("Error creating profile for new user");
          }

          profile = newProfile[0];
        }

        if (!profile.isEnabled) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        c.set("userId", user.id);
        c.set("profileId", profile.id);

        await next();
      } else {
        if (c.get("authOptional")) {
          c.set("userId", undefined);
          c.set("profileId", undefined);
          await next();
        } else {
          const message = tokenError
            ? `Authentication error: ${tokenError}`
            : "Authentication required.";
          return c.json({ error: "Unauthorized", message }, 401);
        }
      }
    } catch (error) {
      if (checkDbError(error as DbError) === DbErrorCode.ConnectionFailure) {
        return c.json({ error: "Error connecting to database" }, 500);
      }
      log("Error authenticating", error);
      return c.json({ error: "Error authenticating" }, 500);
    }
  },
);
