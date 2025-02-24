import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";
import { vi } from "vitest";

import { UserContext } from "@/providers/UserProvider";

import Navbar from ".";

// Mock CurioBrand component
vi.mock("@/components/CurioBrand", () => ({
  __esModule: true,
  CurioBrand: () => <div data-testid="curio-brand">CurioBrand</div>,
}));

describe("Navbar", () => {
  const mockPush = vi.fn();
  const mockClearUser = vi.fn();
  const mockChangeUsername = vi.fn();
  const MockNoUserProvider = ({
    children,
  }: React.PropsWithChildren): JSX.Element => (
    <UserContext.Provider
      value={{
        user: { id: null, username: null, email: null },
        clearUser: mockClearUser,
        changeUsername: mockChangeUsername,
      }}
    >
      {children}
    </UserContext.Provider>
  );
  const MockUserProvider = ({
    children,
  }: React.PropsWithChildren): JSX.Element => (
    <UserContext.Provider
      value={{
        user: { id: "user1", username: "testuser", email: "user@email.com" },
        clearUser: mockClearUser,
        changeUsername: mockChangeUsername,
      }}
    >
      {children}
    </UserContext.Provider>
  );

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
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
      expect(mockPush).toHaveBeenCalledWith("/");
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
    expect(mockPush).toHaveBeenCalledWith("/login");
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
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
