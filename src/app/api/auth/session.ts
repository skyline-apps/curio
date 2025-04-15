/* eslint-disable @local/eslint-local-rules/api-middleware */
/* eslint-disable @local/eslint-local-rules/api-validation */
/* eslint-disable @local/eslint-local-rules/response-parse */
import { profiles } from "@app/api/db/schema";
import { createClient } from "@app/api/lib/supabase/client";
import { EnvBindings, EnvContext } from "@app/api/utils/env";
import { createUsernameSlug } from "@app/api/utils/username";
import { Hono } from "hono";

const sessionRoutes = new Hono<EnvBindings>();

sessionRoutes.post("/", async (c: EnvContext) => {
  const log = c.get("log");
  const db = c.get("db");
  try {
    const { accessToken, refreshToken } = await c.req.json<{
      accessToken?: string;
      refreshToken?: string;
    }>();

    if (!accessToken || !refreshToken) {
      return c.json(
        { error: "Missing access token or refresh token" },
        { status: 400 },
      );
    }

    const supabase = await createClient(c);

    const {
      error,
      data: { user },
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      log.error("Supabase setSession error:", { error });
      return c.json(
        { error: "Failed to set session", details: error.message },
        { status: 500 },
      );
    }

    if (!user || !user.email) {
      log.error("Supabase setSession failed to return user");
      return c.json({ error: "Failed to set session" }, { status: 500 });
    }

    const newProfile = await db
      .insert(profiles)
      .values({
        userId: user.id,
        username: createUsernameSlug(user.email),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          userId: user.id,
        },
      })
      .returning({
        id: profiles.id,
        isEnabled: profiles.isEnabled,
      });

    if (!newProfile || newProfile.length === 0) {
      throw new Error("Error creating profile for new user");
    }

    const profile = newProfile[0];

    if (!profile.isEnabled) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ success: true });
  } catch (error) {
    log.error("Error processing /api/auth/session request", {
      error,
    });
    return c.json({ error: "Internal server error" }, { status: 500 });
  }
});

export default sessionRoutes;
