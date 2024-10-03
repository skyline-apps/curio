/**
 * @jest-environment node
 */
import { db } from "__mocks__/db";
import { supabaseMock } from "__mocks__/supabase";
// eslint-disable-next-line no-restricted-imports
import { NextResponse } from "next/server";

import { GET } from "./route"; // adjust path

describe("GET /auth/callback", () => {
  it("should redirect to error page if no code is provided", async () => {
    const request = new Request("http://localhost/auth/callback");
    const response = await GET(request);

    expect(response).toEqual(
      NextResponse.redirect(
        "http://localhost/auth/auth-code-error?error=Invalid authentication code.",
      ),
    );
  });

  it("should exchange code for session and redirect to next page", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=valid_code&next=/dashboard",
    );

    const profilesMock = db.query.profiles.findFirst;
    profilesMock.mockResolvedValueOnce(null);

    const insertMock = db
      .insert()
      .values()
      .returning.mockResolvedValue([
        { userId: "user1", username: "slug-user@example.com" },
      ]);

    const response = await GET(request);

    expect(supabaseMock.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "valid_code",
    );
    expect(supabaseMock.auth.getUser).toHaveBeenCalled();
    expect(profilesMock).toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalled();
    expect(response).toEqual(
      NextResponse.redirect("http://localhost/dashboard"),
    );
  });

  it("should redirect to error page if profile creation fails", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=valid_code",
    );

    db.query.profiles.findFirst.mockResolvedValueOnce(null); // no existing profile
    db.insert().values().returning.mockResolvedValue([]); // profile creation fails

    const response = await GET(request);
    expect(supabaseMock.auth.getUser).toHaveBeenCalled();

    expect(response).toEqual(
      NextResponse.redirect(
        "http://localhost/auth/auth-code-error?error=Profile creation failed.",
      ),
    );
  });

  it("should show error if exchange code fails", async () => {
    const request = new Request(
      "http://localhost/auth/callback?code=invalid_code",
    );

    supabaseMock.auth.exchangeCodeForSession.mockResolvedValue({
      error: "Some error",
    });

    const response = await GET(request);

    expect(response).toEqual(
      NextResponse.redirect(
        "http://localhost/auth/auth-code-error?error=Invalid authentication code.",
      ),
    );
  });
});
