/* eslint-disable no-restricted-imports */
"use server";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

export type { SupabaseClient } from "@supabase/supabase-js";

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

// Create a service role client for admin operations
export const createServiceClient = async (): Promise<SupabaseClient> => {
  if (!process.env.SERVICE_ROLE_KEY) {
    throw new Error("SERVICE_ROLE_KEY is not set");
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(
          name: string,
          value: string,
          options: Omit<ResponseCookie, "name" | "value">,
        ) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Cookie setting may fail in middleware or other contexts
          }
        },
        remove(name: string, options: Omit<ResponseCookie, "name" | "value">) {
          try {
            cookieStore.set(name, "", {
              ...options,
              maxAge: 0,
            });
          } catch {
            // Cookie removal may fail in middleware or other contexts
          }
        },
      },
    },
  );
};
