/* eslint-disable no-restricted-imports */
"use server";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export type { SupabaseClient } from "@supabase/supabase-js";
export { AuthError } from "@supabase/supabase-js";

export const createClient = async (): Promise<SupabaseClient> => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        // sameSite: "lax",
        // domain: undefined,
      },
    },
  );
};
