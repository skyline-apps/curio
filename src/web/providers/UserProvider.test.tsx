import { act, fireEvent, render, screen } from "@testing-library/react";
import fetchMock from "jest-fetch-mock";
import React from "react";

import { User, UserContext, UserProvider } from "./UserProvider";

describe("UserContext", () => {
  fetchMock.enableMocks();

  const initialUser: User = {
    id: "123",
    username: "testuser",
    email: "test@example.com",
  };

  beforeEach(() => {
    fetchMock.resetMocks();
  });

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
    fetch.mockResponseOnce(JSON.stringify({ updatedUsername: "newtestuser" }));

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

    expect(fetchMock).toHaveBeenCalledWith(
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
