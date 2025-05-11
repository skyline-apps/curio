import "@testing-library/jest-dom/vitest";

import { UserContext } from "@app/providers/User";
import * as React from "react";
import { vi } from "vitest";

// Make React available globally
global.React = React;

// Set up global mocks
vi.mock("@app/utils/logger");

// Mock user
const DEFAULT_TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174002";

vi.mock("@app/providers/User/provider", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => (
    <UserContext.Provider
      value={{
        user: {
          id: DEFAULT_TEST_USER_ID,
          email: "test@example.com",
        },
        refreshUser: vi.fn(),
        clearUser: vi.fn(),
        handleLogout: vi.fn(),
        isLoading: false,
      }}
    >
      {children}
    </UserContext.Provider>
  ),
}));

// Mock react-router-dom
export const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams()]),
  useLocation: () => ({
    pathname: "/",
    search: "",
    hash: "",
    state: null,
    key: "default",
  }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a data-testid="link" href={to}>
      {children}
    </a>
  ),
}));

// Mock API requests
export const mockAuthenticatedFetch = vi.fn();
vi.mock("@app/utils/api", async () => ({
  getSupabaseProjectRef: vi.fn().mockReturnValue("test-project-ref"),
  handleAPIResponse: (await vi.importActual("@app/utils/api"))
    .handleAPIResponse,
  authenticatedFetch: mockAuthenticatedFetch,
}));

// Mock ResizeObserver
class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
window.ResizeObserver = ResizeObserver;

// Mock fetch API
global.fetch = vi.fn(() =>
  Promise.resolve(
    new Response(JSON.stringify({}), {
      status: 200,
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    }),
  ),
);

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  configurable: true,
  writable: true,
});
