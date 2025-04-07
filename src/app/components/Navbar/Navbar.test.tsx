import { UserContext } from "@app/providers/User";
import { act, fireEvent, render, screen, waitFor } from "@app/utils/test";
import { mockNavigate } from "@app/vitest.setup.jsdom";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import Navbar from ".";

// Mock CurioBrand component
vi.mock("@app/components/CurioBrand", () => ({
  __esModule: true,
  CurioBrand: () => <div data-testid="curio-brand">CurioBrand</div>,
}));

describe("Navbar", () => {
  const mockHandleLogout = vi.fn();
  const mockChangeUsername = vi.fn();
  const MockNoUserProvider = ({
    children,
  }: React.PropsWithChildren): React.ReactElement => (
    <UserContext.Provider
      value={{
        user: { id: null, username: null, email: null, newsletterEmail: null },
        clearUser: vi.fn(),
        changeUsername: mockChangeUsername,
        updateNewsletterEmail: vi.fn(),
        handleLogout: mockHandleLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
  const MockUserProvider = ({
    children,
  }: React.PropsWithChildren): React.ReactElement => (
    <UserContext.Provider
      value={{
        user: {
          id: "user1",
          username: "testuser",
          email: "user@email.com",
          newsletterEmail: null,
        },
        clearUser: vi.fn(),
        changeUsername: mockChangeUsername,
        updateNewsletterEmail: vi.fn(),
        handleLogout: mockHandleLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );

  it("renders login button when user is not logged in", async () => {
    await act(async () => {
      render(
        <MockNoUserProvider>
          <Navbar />
        </MockNoUserProvider>,
      );
    });

    const loginButton = screen.getByTestId("button");
    expect(loginButton).toHaveTextContent("Log in");
  });

  it("renders logout option when user is logged in", async () => {
    await act(async () => {
      render(
        <MockUserProvider>
          <Navbar />
        </MockUserProvider>,
      );
    });

    const userButton = screen.getByTestId("button");
    await act(async () => {
      fireEvent.click(userButton);
    });

    const logoutItem = screen.getByText("Log out");
    expect(logoutItem).toBeInTheDocument();
  });

  it("handles login click correctly", async () => {
    // Render component with no user (logged-out state)
    await act(async () => {
      render(
        <MockNoUserProvider>
          <Navbar />
        </MockNoUserProvider>,
      );
    });

    // Simulate clicking the login button
    const loginButton = screen.getByTestId("button");
    await act(async () => {
      fireEvent.click(loginButton);
    });

    // Check if the router push was called with "/login"
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("handles logout click correctly", async () => {
    await act(async () => {
      render(
        <MockUserProvider>
          <Navbar />
        </MockUserProvider>,
      );
    });

    const userButton = screen.getByTestId("button");
    await act(async () => {
      fireEvent.click(userButton);
    });

    const logoutItem = screen.getByText("Log out");
    await act(async () => {
      fireEvent.click(logoutItem);
    });

    await waitFor(() => {
      expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    });
  });
});
