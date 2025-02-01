import { jest } from "@jest/globals";

import { ExtractedMetadata } from "@/utils/extract";

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

export class MetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetadataError";
  }
}

export class Extract {
  async extractMainContentAsMarkdown(_url: string): Promise<string> {
    return "";
  }
  async extractMetadata(_url: string): Promise<ExtractedMetadata> {
    return {
      author: null,
      title: null,
      description: null,
      thumbnail: null,
      publishedAt: null,
    };
  }
}

// Export singleton instance
export const extract = new Extract();

// Create spies for each method
export const extractMainContentAsMarkdown = jest
  .spyOn(extract, "extractMainContentAsMarkdown")
  .mockImplementation(async () => "");

export const extractMetadata = jest
  .spyOn(extract, "extractMetadata")
  .mockImplementation(async () => ({
    author: null,
    title: null,
    description: null,
    thumbnail: null,
    publishedAt: null,
  }));

// Set default mock values
extractMainContentAsMarkdown.mockResolvedValue("Markdown content");

extractMetadata.mockResolvedValue({
  author: "kim",
  title: "test title",
  description: "test description",
  thumbnail: "test thumbnail",
  publishedAt: new Date("2024-01-10T12:50:00-08:00"),
});
