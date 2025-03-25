import { AuthError } from "@web/utils/supabase/__mocks__/server";
import { createClient } from "@web/utils/supabase/server";
import { vi } from "vitest";

// eslint-disable-next-line no-restricted-imports
import { GET } from "./route";

describe("GET /auth/callback", () => {
  it("should redirect to error page if no code is provided", async () => {
    const request = new Request("http://localhost/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/auth-code-error?error=Invalid%20authentication%20code.",
    );
  });

  it("should exchange code for session and redirect to next page", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=valid_code&next=/dashboard",
    );

    const response = await GET(request);
    const supabase = await createClient();

    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "valid_code",
    );
    expect(supabase.auth.getUser).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("should redirect to error page if profile creation fails", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=valid_code",
    );

    const supabase = await createClient();
    // Mock getUser to return null user to trigger profile creation failure
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: new AuthError("User not found"),
    });

    const response = await GET(request);
    expect(supabase.auth.getUser).toHaveBeenCalled();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/auth-code-error?error=Profile%20creation%20failed.",
    );
  });

  it("should redirect to error page if code exchange fails", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=invalid_code",
    );

    const supabase = await createClient();
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new AuthError("Some error"),
    });

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/auth-code-error?error=Invalid%20authentication%20code.",
    );
  });
});
