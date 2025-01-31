import { jest } from "@jest/globals";

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

export class Extract {
  async extractMainContentAsMarkdown(_url: string): Promise<string> {
    return "";
  }
}

// Export singleton instance
export const extract = new Extract();

// Create spies for each method
export const extractMainContentAsMarkdown = jest
  .spyOn(extract, "extractMainContentAsMarkdown")
  .mockImplementation(async () => "");

// Set default mock values
extractMainContentAsMarkdown.mockResolvedValue("Markdown content");
