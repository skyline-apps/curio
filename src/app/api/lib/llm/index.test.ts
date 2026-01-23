import { type EnvContext } from "@app/api/utils/env";
import { createLogger } from "@app/api/utils/logger";
import { describe, expect, it, vi } from "vitest";

import { explainInContext, summarizeItem } from "./index";

vi.unmock("@app/api/lib/llm");
// Mock GoogleGenAI
const mockGenerateContent = vi.fn();
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

describe("@app/api/lib/llm", () => {
  const logger = createLogger({});
  const loggerWarnSpy = vi.spyOn(logger, "warn");

  const mockContext = {
    env: { GEMINI_API_KEY: "test-key" },
    get: (key: string) => {
      if (key === "log") return logger;
      return null;
    },
  } as unknown as EnvContext;

  describe("summarizeItem", () => {
    it("should summarize simple text", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: "Summary.",
      });

      const result = await summarizeItem(mockContext, "Simple text.");
      expect(result).toBe("Summary.");
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it("should handle 429 with retryDelay", async () => {
      // First call fails with 429 and retryDelay
      const error429 = new Error('{"retryDelay":"0.001s"}'); // Small delay for test
      mockGenerateContent.mockRejectedValueOnce(error429);
      // Second call succeeds
      mockGenerateContent.mockResolvedValueOnce({
        text: "Summary after retry.",
      });

      const result = await summarizeItem(mockContext, "Simple text.");
      expect(result).toBe("Summary after retry.");
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        "LLM rate limit hit",
        expect.any(Object),
      );
    });

    it("should respect max retries for 429", async () => {
      vi.useFakeTimers();
      // Mock failure 10 times (more than default retries)
      const error429 = new Error('{"retryDelay":"0.001s"}');
      mockGenerateContent.mockRejectedValue(error429);

      const promise = summarizeItem(mockContext, "Text");

      // Advance timers concurrently to allow the retries to proceed while we await the result
      const advanceTimers = async (): Promise<void> => {
        // Logic: 5 retries * (1ms + 1000ms) = ~5005ms
        for (let i = 0; i < 6; i++) {
          await vi.advanceTimersByTimeAsync(2000);
        }
      };

      await Promise.all([
        expect(promise).rejects.toThrow("Max rate limit retries (3) exceeded."),
        advanceTimers(),
      ]);

      vi.useRealTimers();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        "LLM rate limit hit",
        expect.any(Object),
      );
    });
  });

  describe("explainInContext", () => {
    it("should use the correct prompt structure", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: "Explanation.",
      });

      await explainInContext(
        mockContext,
        "snippet",
        "Complete text with snippet.",
      );

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents[0].parts[0].text).toContain(
        "<highlight_snippet>",
      );
      expect(callArgs.contents[0].parts[0].text).toContain("snippet");
      // Check systemInstruction in config
      expect(callArgs.config.systemInstruction.parts[0].text).toContain(
        "helpful reading assistant",
      );
    });
  });
});
