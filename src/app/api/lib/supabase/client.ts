import { EnvContext } from "@app/api/utils/env";
import { createServerClient, parseCookieHeader } from "@supabase/ssr"; // eslint-disable-line no-restricted-imports
import type { SupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports
import { setCookie } from "hono/cookie";

// eslint-disable-next-line no-restricted-imports
export type {
  PostgrestError,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
export type StorageClient = SupabaseClient["storage"];

export const createClient = async (
  c: EnvContext,
  useAdmin: boolean = false,
): Promise<SupabaseClient> => {
  const requestHost = new URL(c.req.url).hostname;
  const domainParts = requestHost.split(".");
  const baseDomain =
    domainParts.length > 1 ? domainParts.slice(-2).join(".") : requestHost;

  return createServerClient(
    c.env.VITE_SUPABASE_URL!,
    useAdmin ? c.env.SUPABASE_SERVICE_ROLE_KEY! : c.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOptions = {
              ...options,
              sameSite: "None",
              secure: true,
              httpOnly: true,
              domain: baseDomain,
              path: "/",
            };
            setCookie(c, name, value, secureOptions);
          });
        },
      },
      cookieOptions: {
        secure: c.env.VITE_CURIO_URL.startsWith("https://"),
      },
    },
  );
};
