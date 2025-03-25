/* eslint-disable no-restricted-imports */
import { createServerClient } from "@supabase/ssr";
import { PostgrestError } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createLogger } from "@web/utils/logger";

const log = createLogger("supabase.middleware");

const UNPROTECTED_ROUTES = ["/login", "/auth", "/api/", "/u/", "/item/"];

export const updateSession = async (
  request: NextRequest,
): Promise<NextResponse> => {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const apiKey = request.headers.get("x-api-key");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !UNPROTECTED_ROUTES.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    ) &&
    request.nextUrl.pathname !== "/"
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (
    !user &&
    request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.startsWith("/api/v1/public")
  ) {
    // Validate API key if passed in
    if (apiKey) {
      const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: () => {},
          },
        },
      );
      const {
        data: keyData,
        error: keyError,
      }:
        | { data: { profiles: { user_id: string } } | null; error: null }
        | { data: null; error: PostgrestError } = await adminClient
        .from("api_keys")
        .select("profiles(user_id)")
        .eq("key", apiKey)
        .eq("is_active", true)
        .eq("profiles.is_enabled", true)
        .single();
      if (keyError || !keyData) {
        log.error("Invalid API key provided");
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }
      await adminClient
        .from("api_keys")
        .update({ last_used_at: new Date() })
        .eq("key", apiKey);
      const userId = keyData.profiles.user_id;
      supabaseResponse.headers.set("X-User-ID", userId);
      return supabaseResponse;
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user) {
    supabaseResponse.headers.set("X-User-ID", user.id);
  }

  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
};
