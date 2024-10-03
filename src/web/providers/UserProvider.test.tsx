import { act, render, screen } from "@testing-library/react";
import React from "react";

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

  it("changes username when changeUsername is called", () => {
    let changeUsernameFunction: (username: string) => void;

    render(
      <UserProvider user={initialUser}>
        <UserContext.Consumer>
          {({ user, changeUsername }) => {
            changeUsernameFunction = changeUsername;
            return <span data-testid="user-username">{user.username}</span>;
          }}
        </UserContext.Consumer>
      </UserProvider>,
    );

    expect(screen.getByTestId("user-username")).toHaveTextContent("testuser");

    act(() => {
      changeUsernameFunction("newusername");
    });

    expect(screen.getByTestId("user-username")).toHaveTextContent(
      "newusername",
    );
  });
});
