import { createLogger } from "@app/utils/logger";
import { getSupabaseClient } from "@app/utils/supabase";

const log = createLogger("api");

export const getSupabaseProjectRef = (): string | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    log.error("VITE_SUPABASE_URL is not defined");
    return null;
  }
  try {
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0];
  } catch (e) {
    log.error("Could not parse VITE_SUPABASE_URL", e);
    return null;
  }
};

const forceLogout = (): void => {
  const projectRef = getSupabaseProjectRef();
  if (!projectRef) {
    return;
  }
  document.cookie = `sb-${projectRef}-auth-token.0=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `sb-${projectRef}-auth-token.1=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  window.localStorage.clear();
};

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.status < 200 || response.status >= 300) {
    const error = await response.json();
    throw new Error(error.error);
  }
  const result = await response.json();
  return result;
}

export async function authenticatedFetch(
  relativePath: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  const baseUrl = import.meta.env.VITE_CURIO_URL;
  if (!baseUrl) {
    throw new Error("VITE_CURIO_URL is not defined in environment variables.");
  }

  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanRelativePath = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;
  const fullUrl = `${cleanBaseUrl}${cleanRelativePath}`;

  if (
    options.method !== "GET" &&
    !headers.has("Content-Type") &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    log.warn("Unauthorized, signing out");
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (_) {}
    forceLogout();
    window.location.href = "/login";
  }

  return response;
}
