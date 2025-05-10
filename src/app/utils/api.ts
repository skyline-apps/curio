import { getSupabaseClient } from "@app/utils/supabase";

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.status < 200 || response.status >= 300) {
    const error = await response.json();
    throw new Error(error.error);
  }
  const result = await response.json();
  return result;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (
    options.method !== "GET" &&
    !headers.has("Content-Type") &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (_) {}
    window.localStorage.clear();
    window.location.href = "/login";
  }

  return response;
}
