import { createClient, type PostgrestError } from "@api/lib/supabase/client";
import { EnvContext } from "@api/utils/env";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(
  async (
    c: EnvContext,
    next: () => Promise<Response | void>,
  ): Promise<Response | void> => {
    const supabase = createClient(c);

    // Check if API key is provided for API routes
    const apiKey = c.req.header("x-api-key");

    // Handle API routes with API key
    if (apiKey) {
      const adminClient = createClient(c, true);
      try {
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

        if (keyError || !keyData || !keyData.profiles) {
          return c.json({ error: "Invalid API key" }, 401);
        }

        // Update last used timestamp
        await adminClient
          .from("api_keys")
          .update({ last_used_at: new Date() })
          .eq("key", apiKey);

        const userId = keyData.profiles.user_id;
        c.set("userId", userId);
        await next();
        return;
      } catch (_error) {
        return c.json({ error: "Authentication error" }, 500);
      }
    }

    // Get JWT tokens from cookies
    const accessToken = getCookie(c, "sb-access-token");
    const refreshToken = getCookie(c, "sb-refresh-token");

    // Set auth cookies if they exist
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // If API route but no API key and no user, return 401
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Set user ID header if user is authenticated
    if (user) {
      c.set("userId", user.id);
    }

    // Session refresh handling
    if (accessToken && refreshToken) {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

      if (!sessionError && sessionData.session) {
        // Set refreshed cookies
        setCookie(c, "sb-access-token", sessionData.session.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          path: "/",
        });
        setCookie(c, "sb-refresh-token", sessionData.session.refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          path: "/",
        });
      }
    }

    await next();
  },
);
