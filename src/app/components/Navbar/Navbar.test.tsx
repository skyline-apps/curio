import { UserContext } from "@app/providers/User";
import { act, fireEvent, render, screen, waitFor } from "@app/utils/test";
import React from "react";
import { useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navbar from ".";

// Mock CurioBrand component
vi.mock("@app/components/CurioBrand", () => ({
  __esModule: true,
  CurioBrand: () => <div data-testid="curio-brand">CurioBrand</div>,
}));

describe("Navbar", () => {
  const mockNavigate = vi.fn();
  const mockClearUser = vi.fn();
  const mockChangeUsername = vi.fn();
  const MockNoUserProvider = ({
    children,
  }: React.PropsWithChildren): React.ReactElement => (
    <UserContext.Provider
      value={{
        user: { id: null, username: null, email: null, newsletterEmail: null },
        clearUser: mockClearUser,
        changeUsername: mockChangeUsername,
        updateNewsletterEmail: vi.fn(),
        handleLogout: vi.fn(),
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
        clearUser: mockClearUser,
        changeUsername: mockChangeUsername,
        updateNewsletterEmail: vi.fn(),
        handleLogout: vi.fn(),
      }}
    >
      {children}
    </UserContext.Provider>
  );

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it("renders login button when user is not logged in", async () => {
    await act(async () => {
      render(
        <MockNoUserProvider>
          <Navbar />
        </MockNoUserProvider>,
      );
    });

    const loginButton = screen.getByTestId("button");
    expect(loginButton).toHaveTextContent("Log In");
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

    const logoutItem = screen.getByText("Log Out");
    expect(logoutItem).toBeInTheDocument();
  });

  it("calls clearUser and redirects on logout", async () => {
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

    const logoutItem = screen.getByText("Log Out");
    await act(async () => {
      fireEvent.click(logoutItem);
    });

    await waitFor(() => {
      expect(mockClearUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
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

    const logoutItem = screen.getByText("Log Out");
    await act(async () => {
      fireEvent.click(logoutItem);
    });

    await waitFor(() => {
      expect(mockClearUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
