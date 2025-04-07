import "@testing-library/jest-dom/vitest";

import * as React from "react";
import { vi } from "vitest";

// Make React available globally
global.React = React;

// Mock environment variables
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");

// Set up global mocks
vi.mock("@app/utils/logger");

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
