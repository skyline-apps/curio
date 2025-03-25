import "@testing-library/jest-dom/vitest";

import * as React from "react";
import { vi } from "vitest";

// Make React available globally
global.React = React;

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");

// Set up global mocks
vi.mock("@web/lib/search");
vi.mock("@web/lib/extract");
vi.mock("@web/lib/storage");
vi.mock("@web/utils/logger");

// Mock Next.js navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => mockRouter),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
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
