/* eslint-disable @local/eslint-local-rules/api-middleware */
/* eslint-disable @local/eslint-local-rules/api-validation */
/* eslint-disable @local/eslint-local-rules/response-parse */
import { createClient } from "@app/api/lib/supabase/client";
import { EnvBindings, EnvContext } from "@app/api/utils/env";
import { Hono } from "hono";

const logoutRoutes = new Hono<EnvBindings>();

logoutRoutes.post("/", async (c: EnvContext) => {
  const log = c.get("log");
  try {
    const supabase = await createClient(c);

    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      log.warn("Server-side supabase.auth.signOut() failed", { error });
    }
    return c.json({ success: true });
  } catch (error) {
    log.error("Error processing /api/auth/logout request", {
      error,
    });
    return c.json({ error: "Internal server error" }, { status: 500 });
  }
});

export default logoutRoutes;
