import { createLogger } from "@app/utils/logger";
import { supabase } from "@app/utils/supabase";

const log = createLogger("api");

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.status < 200 || response.status >= 300) {
    const error = await response.text();
    throw new Error(error);
  }
  const result = await response.json();
  return result;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    log.error("Error getting Supabase session:", error);
    throw new Error("Authentication error");
  }

  const isPublic = url.includes("/api/v1/public");

  if (!session && !isPublic) {
    throw new Error("User not authenticated");
  }

  const headers = new Headers(options.headers);
  if (session) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
