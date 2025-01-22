import { supabaseMock } from "__mocks__/supabase";

// eslint-disable-next-line no-restricted-imports
import { GET } from "./route"; // adjust path

describe("GET /auth/callback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    expect(supabaseMock.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "valid_code",
    );
    expect(supabaseMock.auth.getUser).toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("should redirect to error page if profile creation fails", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=valid_code",
    );

    // Mock getUser to return null user to trigger profile creation failure
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const response = await GET(request);
    expect(supabaseMock.auth.getUser).toHaveBeenCalled();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/auth-code-error?error=Profile%20creation%20failed.",
    );
  });

  it("should show error if exchange code fails", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=invalid_code",
    );

    supabaseMock.auth.exchangeCodeForSession.mockResolvedValueOnce({
      error: "Some error",
    });

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/auth-code-error?error=Invalid%20authentication%20code.",
    );
  });
});
