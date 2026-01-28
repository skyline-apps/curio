import { createLogger } from "@app/utils/logger";
import { isNativePlatform } from "@app/utils/platform";
import { getSupabaseClient } from "@app/utils/supabase";

const log = createLogger("api");

const OFFLINE_ERROR_MESSAGE = "It looks like you're offline...";

export const isOfflineError = (error: unknown): boolean => {
  return (
    error instanceof OfflineError ||
    (error instanceof Error && error.message.includes(OFFLINE_ERROR_MESSAGE))
  );
};

export class OfflineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfflineError";
  }
}

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
  if (!response.ok) {
    let errorMessage = `Failed to fetch: ${response.status} ${response.statusText}`;
    try {
      const text = await response.text();
      // Try to parse as JSON if it looks like JSON
      if (text.startsWith("{") || text.startsWith("[")) {
        try {
          const json = JSON.parse(text);
          if (json.error) {
            errorMessage = json.error;
          } else {
            errorMessage = `${errorMessage} - ${text}`;
          }
        } catch {
          errorMessage = `${errorMessage} - ${text}`;
        }
      } else {
        errorMessage = `${errorMessage} - ${text}`;
      }
    } catch {
      // Ignore text reading error
    }
    throw new Error(errorMessage);
  }
  const result = await response.json();
  return result;
}

async function authenticatedRequest(
  relativePath: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  const baseUrl = import.meta.env.VITE_CURIO_URL;
  if (!baseUrl) {
    throw new Error("VITE_CURIO_URL is not defined in environment variables.");
  }

  if (isNativePlatform()) {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error("User not authenticated");
    }
    headers.set("Authorization", `Bearer ${session.access_token}`);
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

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      const currentHeaders = new Headers(options.headers);
      if (!currentHeaders.has("X-Retry-Auth")) {
        log.warn("401 received. Attempting session refresh...");
        try {
          const supabase = getSupabaseClient();
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (!error && session) {
            // Explicitly sync session to server to ensure cookies are updated
            try {
              await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  accessToken: session.access_token,
                  refreshToken: session.refresh_token,
                }),
              });
            } catch (e) {
              log.error("Failed to sync session on 401 retry", e);
            }

            // Retry the request with the new session (cookies should be set now)
            currentHeaders.set("X-Retry-Auth", "true");
            return authenticatedRequest(relativePath, {
              ...options,
              headers: currentHeaders,
            });
          }
        } catch (e) {
          log.error("Error refreshing session on 401", e);
        }
      }

      log.warn("Unauthorized, signing out");
      try {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
      } catch (_) {}
      forceLogout();
      window.location.href = "/login";
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        log.warn("Offline. Failed to fetch", fullUrl);
        throw new OfflineError(OFFLINE_ERROR_MESSAGE);
      }
      log.error("Error during fetch:", fullUrl, error.message);
    } else {
      log.error("Unknown error during fetch:", fullUrl, error);
    }
    throw error;
  }
}

export async function* authenticatedStreamFetch<T = unknown>(
  relativePath: string,
  options: RequestInit = {},
): AsyncGenerator<string | T, void, unknown> {
  const response = await authenticatedRequest(relativePath, {
    ...options,
    headers: {
      ...options.headers,
      Accept: "text/event-stream",
    },
  });
  if (response.status === 401) return;

  if (!response.ok) {
    let errorMessage = "Stream request failed";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type") || "";
  if (
    contentType.includes("event-stream") ||
    contentType.includes("text/plain")
  ) {
    if (!response.body) {
      throw new Error("No response body for streaming");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          yield decoder.decode(value, { stream: true });
        }
      }
    } finally {
      reader.releaseLock();
    }
    return;
  } else if (contentType.includes("application/json")) {
    const data = await response.json();
    yield data;
  } else {
    const text = await response.text();
    yield text;
  }
}

export async function authenticatedFetch(
  relativePath: string,
  options: RequestInit = {},
): Promise<Response> {
  return authenticatedRequest(relativePath, options);
}

export async function publicFetch(
  relativePath: string,
  options: RequestInit = {},
): Promise<Response> {
  const baseUrl = import.meta.env.VITE_CURIO_URL;
  if (!baseUrl) {
    throw new Error("VITE_CURIO_URL is not defined in environment variables.");
  }
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanRelativePath = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;
  const fullUrl = `${cleanBaseUrl}${cleanRelativePath}`;

  const headers = new Headers(options.headers);
  if (
    options.method !== "GET" &&
    !headers.has("Content-Type") &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  });
}
