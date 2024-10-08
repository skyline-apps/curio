import { supabaseMock } from "__mocks__/supabase";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import fetchMock from "jest-fetch-mock";
import { useRouter } from "next/navigation";
import React from "react";

import { UserContext } from "@/providers/UserProvider";

import Navbar from ".";

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
    // Mock useRouter implementation
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders login button when user is not logged in", () => {
    // Render component with user not logged in (user.id is falsy)
    render(
      <MockNoUserProvider>
        <Navbar />
      </MockNoUserProvider>,
    );

    // Check if the login button is rendered
    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  it("renders logout option when user is logged in", () => {
    // Render component with a logged-in user
    render(
      <MockUserProvider>
        <Navbar />
      </MockUserProvider>,
    );

    // Check if the logout button is rendered in the dropdown
    fireEvent.click(screen.getByRole("button")); // Open the dropdown
    expect(screen.getByText("Log Out")).toBeInTheDocument();
  });

  it("handles logout correctly", async () => {
    // Render component with a logged-in user
    render(
      <MockUserProvider>
        <Navbar />
      </MockUserProvider>,
    );

    // Simulate opening the dropdown and clicking on "Log Out"
    fireEvent.click(screen.getByRole("button")); // Open the dropdown
    fireEvent.click(screen.getByText("Log Out"));

    // Check if supabase.auth.signOut was called
    await waitFor(() => {
      expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    });

    // Check if clearUser was called
    expect(mockClearUser).toHaveBeenCalled();

    // Check if the router push was called to redirect to "/"
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("handles login click correctly", () => {
    // Render component with no user (logged-out state)
    render(
      <MockNoUserProvider>
        <Navbar />
      </MockNoUserProvider>,
    );

    // Simulate clicking the login button
    fireEvent.click(screen.getByText("Log In"));

    // Check if the router push was called with "/login"
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
