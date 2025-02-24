import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { User, UserContext, UserProvider } from "./UserProvider";

describe("UserContext", () => {
  const initialUser: User = {
    id: "123",
    username: "testuser",
    email: "test@example.com",
  };

  it("provides initial user values", () => {
    render(
      <UserProvider user={initialUser}>
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

    expect(screen.getByTestId("user-id")).toHaveTextContent("123");
    expect(screen.getByTestId("user-username")).toHaveTextContent("testuser");
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "test@example.com",
    );
  });

  it("clears user data when clearUser is called", () => {
    let clearUserFunction: () => void;

    render(
      <UserProvider user={initialUser}>
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

    expect(screen.getByTestId("user-id")).toHaveTextContent("");
    expect(screen.getByTestId("user-username")).toHaveTextContent("");
    expect(screen.getByTestId("user-email")).toHaveTextContent("");
  });

  it("changes username when changeUsername is called", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ updatedUsername: "newtestuser" }), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      ),
    );

    render(
      <UserProvider user={initialUser}>
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

    expect(screen.getByTestId("username")).toHaveTextContent("testuser");
    await act(async () => {
      await fireEvent.click(screen.getByText("Change username"));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/user/username",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: initialUser.id,
          username: "newtestuser",
        }),
      }),
    );
    expect(screen.getByTestId("username")).toHaveTextContent("newtestuser");
  });
});
