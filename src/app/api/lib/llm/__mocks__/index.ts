import { vi } from "vitest";

export const summarizeItem = vi.fn().mockResolvedValue("This is the summary.");
export const explainInContext = vi
  .fn()
  .mockResolvedValue("This is the explanation.");
