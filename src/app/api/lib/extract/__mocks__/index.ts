import { ExtractedMetadata } from "@app/api/lib/extract/types";
import { TextDirection } from "@app/schemas/db";
import { vi } from "vitest";

export const MOCK_METADATA: ExtractedMetadata = {
  author: "kim",
  title: "test title",
  description: "test description",
  thumbnail: "test thumbnail",
  favicon: "test favicon",
  publishedAt: new Date("2024-01-10T12:50:00-08:00"),
  textDirection: TextDirection.LTR,
  textLanguage: "en",
};

export class Extract {
  async extractFromHtml(
    _url: string,
    _html: string,
  ): Promise<{ content: string; metadata: ExtractedMetadata }> {
    return { content: "", metadata: MOCK_METADATA };
  }
}

// Export singleton instance
export const extract = new Extract();

// Create spies for each method
export const extractFromHtml = vi
  .spyOn(extract, "extractFromHtml")
  .mockImplementation(async () => ({
    content: "",
    metadata: MOCK_METADATA,
  }));

// Set default mock values
extractFromHtml.mockResolvedValue({
  content: "Markdown content",
  metadata: MOCK_METADATA,
});
