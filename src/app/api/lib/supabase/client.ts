import { EnvContext } from "@app/api/utils/env";
import { createServerClient, parseCookieHeader } from "@supabase/ssr"; // eslint-disable-line no-restricted-imports
import type { SupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports
import { setCookie } from "hono/cookie";

export type { SupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports

export const createClient = async (
  c: EnvContext,
  useAdmin: boolean = false,
): Promise<SupabaseClient> => {
  return createServerClient(
    c.env.VITE_SUPABASE_URL!,
    useAdmin ? c.env.SUPABASE_SERVICE_ROLE_KEY! : c.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            setCookie(c, name, value, options),
          );
        },
      },
      cookieOptions: {
        secure: c.env.VITE_CURIO_URL.startsWith("https://"),
        // sameSite: "lax",
        // domain: undefined,
      },
    },
  );
};
