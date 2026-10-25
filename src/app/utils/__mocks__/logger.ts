import { vi } from "vitest";

export const createLogger = vi.fn().mockReturnValue({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});
