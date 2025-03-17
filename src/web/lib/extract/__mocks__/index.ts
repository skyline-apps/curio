import { vi } from "vitest";

import { TextDirection } from "@/db/schema";
import { ExtractedMetadata } from "@/lib/extract/types";

export const MOCK_METADATA: ExtractedMetadata = {
  author: "kim",
  title: "test title",
  description: "test description",
  thumbnail: "test thumbnail",
  favicon: "test favicon",
  publishedAt: new Date("2024-01-10T12:50:00-08:00"),
  textDirection: TextDirection.LTR,
};

export class Extract {
  async extractMainContentAsMarkdown(
    _url: string,
    _html: string,
  ): Promise<{ content: string }> {
    return { content: "" };
  }
  async extractMetadata(_url: string): Promise<ExtractedMetadata> {
    return {
      author: null,
      title: null,
      description: null,
      thumbnail: null,
      favicon: null,
      publishedAt: null,
      textDirection: TextDirection.LTR,
    };
  }
}

// Export singleton instance
export const extract = new Extract();

// Create spies for each method
export const extractMainContentAsMarkdown = vi
  .spyOn(extract, "extractMainContentAsMarkdown")
  .mockImplementation(async () => ({
    content: "",
  }));

export const extractMetadata = vi
  .spyOn(extract, "extractMetadata")
  .mockImplementation(async () => ({
    author: null,
    title: null,
    description: null,
    thumbnail: null,
    favicon: null,
    publishedAt: null,
    textDirection: TextDirection.LTR,
  }));

// Set default mock values
extractMainContentAsMarkdown.mockResolvedValue({
  content: "Markdown content",
});

extractMetadata.mockResolvedValue(MOCK_METADATA);
