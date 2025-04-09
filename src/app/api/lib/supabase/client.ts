import { type EnvContext } from "@app/api/utils/env";
import type { SupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports
import { createClient as createSupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports

export type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports
export type StorageClient = SupabaseClient["storage"];

export const createClient = (
  c: EnvContext,
  useAdmin: boolean = false,
): SupabaseClient => {
  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseAnonKey = c.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = c.env.SUPABASE_SERVICE_ROLE_KEY;

  const cookies: Record<string, string> = {};
  const cookieHeader = c.req.header("Cookie");
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie: string) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = value;
    });
  }

  // Create Supabase client
  const supabase = createSupabaseClient(
    supabaseUrl,
    useAdmin ? supabaseServiceRoleKey : supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Cookie: cookieHeader || "",
        },
      },
    },
  );

  return supabase;
};
