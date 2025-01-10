import { supabaseMock } from "__mocks__/supabase";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import fetchMock from "jest-fetch-mock";
import { useRouter } from "next/navigation";
import React from "react";

import { UserContext } from "@/providers/UserProvider";

import Navbar from ".";

// Mock CurioBrand component
jest.mock("@/components/CurioBrand", () => ({
  __esModule: true,
  CurioBrand: () => <div data-testid="curio-brand">CurioBrand</div>,
}));

// Mock NextUI components
jest.mock("@nextui-org/navbar", () => ({
  Navbar: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="navbar">{children}</nav>
  ),
  NavbarContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="navbar-content">{children}</div>
  ),
  NavbarItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="navbar-item">{children}</div>
  ),
  NavbarBrand: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="navbar-brand">{children}</div>
  ),
}));

jest.mock("@nextui-org/button", () => ({
  Button: ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <button data-testid="button" onClick={onPress}>
      {children}
    </button>
  ),
}));

jest.mock("@nextui-org/dropdown", () => ({
  Dropdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown">{children}</div>
  ),
  DropdownTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownItem: ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <div data-testid="dropdown-item" onClick={onPress}>
      {children}
    </div>
  ),
}));

// Mock the useRouter hook
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Navbar", () => {
  fetchMock.enableMocks();

  const mockPush = jest.fn();
  const mockClearUser = jest.fn();
  const mockChangeUsername = jest.fn();
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
    fetchMock.resetMocks();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
    }));
    jest.clearAllMocks();
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
    supabaseMock.auth.signOut.mockResolvedValue({ error: null });

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
});
