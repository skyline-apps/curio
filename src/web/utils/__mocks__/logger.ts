import { vi } from "vitest";

export const createLogger = vi.fn(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  // eslint-disable-next-line no-console
  error: console.error,
}));
