import { and, eq } from "@app/api/db";
import { checkDbError, DbError, DbErrorCode } from "@app/api/db/errors";
import { apiKeys, profiles } from "@app/api/db/schema";
import { createClient } from "@app/api/lib/supabase/client";
import { EnvContext } from "@app/api/utils/env";
import { createUsernameSlug } from "@app/api/utils/username";
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

      // Create client - it automatically reads cookies from the request
      const supabase = await createClient(c);

      // Get current user - this verifies the session based on cookies handled by ssr client
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // If getUser fails or returns no user, authentication fails
      if (error || !user?.email) {
        return returnDefault(c, next);
      }

      // Check/create profile in DB (existing logic)
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
