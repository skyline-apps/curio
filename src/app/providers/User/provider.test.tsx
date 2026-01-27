import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserContext } from ".";
import { UserProvider } from "./provider";

vi.unmock("@app/providers/User/provider");

describe("UserContext", () => {
  beforeEach(() => {
    vi.mock("@app/utils/supabase", () => ({
      getSupabaseClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "123",
                  username: "testuser",
                  email: "test@example.com",
                  newsletterEmail: null,
                },
              }),
            }),
          }),
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "123",
                email: "test@example.com",
              },
            },
          }),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
        },
      }),
    }));
  });

  it("provides initial user values", async () => {
    render(
      <UserProvider>
        <UserContext.Consumer>
          {({ user }) => (
            <div>
              <span data-testid="user-id">{user.id}</span>
              <span data-testid="user-email">{user.email}</span>
            </div>
          )}
        </UserContext.Consumer>
      </UserProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("123");
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com",
      );
    });
  });

  it("clears user data when clearUser is called", async () => {
    let clearUserFunction: () => void;

    render(
      <UserProvider>
        <UserContext.Consumer>
          {({ user, clearUser }) => {
            clearUserFunction = clearUser;
            return (
              <div>
                <span data-testid="user-id">{user.id}</span>
                <span data-testid="user-email">{user.email}</span>
              </div>
            );
          }}
        </UserContext.Consumer>
      </UserProvider>,
    );

    act(() => {
      clearUserFunction();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("");
      expect(screen.getByTestId("user-email")).toHaveTextContent("");
    });
  });
});
