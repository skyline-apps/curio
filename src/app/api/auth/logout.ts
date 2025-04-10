/* eslint-disable @local/eslint-local-rules/api-middleware */
/* eslint-disable @local/eslint-local-rules/api-validation */
/* eslint-disable @local/eslint-local-rules/response-parse */
import { createClient } from "@app/api/lib/supabase/client";
import { EnvBindings, EnvContext } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { Hono } from "hono";

const logoutRoutes = new Hono<EnvBindings>();

logoutRoutes.post("/", async (c: EnvContext) => {
  try {
    const supabase = await createClient(c);

    const { error } = await supabase.auth.signOut();

    if (error) {
      return c.json({
        success: true,
        error: `Server signout failed: ${error.message}`,
      });
    }

    return c.json({ success: true });
  } catch (err) {
    log(
      "Error processing /api/auth/logout request:",
      err instanceof Error ? err.message : err,
    );
    return c.json({ error: "Internal server error" }, { status: 500 });
  }
});

export default logoutRoutes;
