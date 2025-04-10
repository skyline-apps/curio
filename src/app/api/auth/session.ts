/* eslint-disable @local/eslint-local-rules/api-middleware */
/* eslint-disable @local/eslint-local-rules/api-validation */
/* eslint-disable @local/eslint-local-rules/response-parse */
import { createClient } from "@app/api/lib/supabase/client";
import { EnvBindings, EnvContext } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { Hono } from "hono";

const sessionRoutes = new Hono<EnvBindings>();

sessionRoutes.post("/", async (c: EnvContext) => {
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

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      log("Supabase setSession error:", error.message);
      return c.json(
        { error: "Failed to set session", details: error.message },
        { status: 500 },
      );
    }

    // Cookies are set automatically by the `setAll` handler in createClient
    return c.json({ success: true });
  } catch (err) {
    log(
      "Error processing /api/auth/session request:",
      err instanceof Error ? err.message : err,
    );
    return c.json({ error: "Internal server error" }, { status: 500 });
  }
});

export default sessionRoutes;
