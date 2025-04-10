import { mockAuthenticatedFetch } from "@app/vitest.setup.jsdom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
              <span data-testid="user-username">{user.username}</span>
              <span data-testid="user-email">{user.email}</span>
            </div>
          )}
        </UserContext.Consumer>
      </UserProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("123");
      expect(screen.getByTestId("user-username")).toHaveTextContent("testuser");
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
                <span data-testid="user-username">{user.username}</span>
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
      expect(screen.getByTestId("user-username")).toHaveTextContent("");
      expect(screen.getByTestId("user-email")).toHaveTextContent("");
    });
  });

  it("changes username when changeUsername is called", async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ updatedUsername: "newtestuser" }), {
        status: 200,
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    render(
      <UserProvider>
        <UserContext.Consumer>
          {({ user, changeUsername }) => (
            <div>
              <button onClick={() => changeUsername("newtestuser")}>
                Change username
                <div data-testid="username">{user.username}</div>
              </button>
            </div>
          )}
        </UserContext.Consumer>
      </UserProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("username")).toHaveTextContent("testuser");
    });

    act(() => {
      fireEvent.click(screen.getByText("Change username"));
    });

    await waitFor(() => {
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        "/api/v1/user/username",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: "123",
            username: "newtestuser",
          }),
        }),
      );
      expect(screen.getByTestId("username")).toHaveTextContent("newtestuser");
    });
  });
});
