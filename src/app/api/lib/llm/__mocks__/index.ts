import { vi } from "vitest";

export const summarizeItem = vi.fn().mockResolvedValue("This is the summary.");
export const summarizeItemStream = vi
  .fn()
  .mockImplementation(async function* () {
    yield "This is the summary.";
    yield "\nContinued summary section.";
    yield "\nFinal summary section.";
    yield "\nDone.";
  });
export const explainInContext = vi
  .fn()
  .mockResolvedValue("This is the explanation.");
