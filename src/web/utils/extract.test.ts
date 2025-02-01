import fs from "fs";
import path from "path";

import { Extract, ExtractError } from "@/utils/extract";

jest.unmock("@/utils/extract");

describe("Extract", () => {
  let extract: Extract;
  const fixturesPath = path.join(process.cwd(), "test/fixtures");

  beforeEach(() => {
    extract = new Extract();
  });

  describe("extractMainContentAsMarkdown", () => {
    it("should extract and convert simple HTML content to markdown", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "simple.html"),
        "utf-8",
      );
      const markdown = await extract.extractMainContentAsMarkdown(
        "http://example.com",
        html,
      );

      expect(markdown).toContain("# Main Content");
      expect(markdown).toContain(
        "This is a simple paragraph with some **bold text**",
      );
      expect(markdown).toContain("![Test image](http://example.com/test.jpg)");
      expect(markdown).toContain("-   List item 1");
      expect(markdown).toContain("-   List item 2");

      expect(markdown).not.toContain("Menu items that should be ignored");
      expect(markdown).not.toContain("Footer content that should be ignored");
    });

    it("should handle complex HTML with nested elements and code blocks", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "complex.html"),
        "utf-8",
      );

      const markdown = await extract.extractMainContentAsMarkdown(
        "http://example.com",
        html,
      );

      expect(markdown).toContain("# Complex Article");
      expect(markdown).toContain("_various_");
      expect(markdown).toContain("`code blocks`");
      expect(markdown).toMatch(/```[\s\S]*function test\(\)[\s\S]*```/);
      expect(markdown).toMatch(/>\s*This is a blockquote/);
      expect(markdown).toContain(
        "![Complex test image](http://example.com/complex.jpg)",
      );

      expect(markdown).not.toContain("Navigation that should be ignored");
      expect(markdown).not.toContain("Sidebar content to ignore");
      expect(markdown).not.toContain("Aside content to ignore");
    });

    it("should extract and convert img content to markdown", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "img.html"),
        "utf-8",
      );

      const markdown = await extract.extractMainContentAsMarkdown(
        "http://host.com",
        html,
      );

      expect(markdown).toContain(
        "[with alt text](http://host.com/relative.jpg)",
      );
      expect(markdown).toContain("![](https://example.com/image.jpg)");
      expect(markdown).toContain(
        "http://host.com/dog.jpg?width=1100&height=825",
      );
      expect(markdown).toContain(
        '[![Test Image](https://example.com/thumb.jpg "Example Title") ](https://example.com/fullsize.jpg)',
      );
    });

    it("should throw ExtractError when content extraction fails", async () => {
      const invalidHtml = "<html><body></body></html>";

      await expect(
        extract.extractMainContentAsMarkdown("http://example.com", invalidHtml),
      ).rejects.toThrow(ExtractError);
    });
  });

  describe("extractMetadata", () => {
    it("should extract metadata from Open Graph tags", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG Test Title" />
            <meta property="og:description" content="OG test description" />
            <meta property="og:image" content="https://example.com/og-image.jpg" />
            <meta property="article:author" content="John Doe" />
            <meta property="article:published_time" content="2024-01-31T08:00:00Z" />
          </head>
          <body></body>
        </html>
      `;

      const metadata = await extract.extractMetadata(
        "https://example.com",
        html,
      );

      expect(metadata).toEqual({
        title: "OG Test Title",
        description: "OG test description",
        thumbnail: "https://example.com/og-image.jpg",
        author: "John Doe",
        publishedAt: new Date("2024-01-31T08:00:00Z"),
      });
    });

    it("should extract metadata from JSON-LD", async () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": "JSON-LD Test Title",
                "description": "JSON-LD test description",
                "image": "https://example.com/jsonld-image.jpg",
                "author": {
                  "@type": "Person",
                  "name": "Jane Smith"
                },
                "datePublished": "2024-01-31T08:00:00Z"
              }
            </script>
          </head>
          <body></body>
        </html>
      `;

      const metadata = await extract.extractMetadata(
        "https://example.com",
        html,
      );

      expect(metadata).toEqual({
        title: "JSON-LD Test Title",
        description: "JSON-LD test description",
        thumbnail: "https://example.com/jsonld-image.jpg",
        author: "Jane Smith",
        publishedAt: new Date("2024-01-31T08:00:00Z"),
      });
    });

    it("should extract metadata from standard meta tags and title", async () => {
      const html = `
        <html>
          <head>
            <title>Standard Test Title</title>
            <meta name="description" content="Standard test description" />
            <meta name="author" content="Bob Wilson" />
          </head>
          <body></body>
        </html>
      `;

      const metadata = await extract.extractMetadata(
        "https://example.com",
        html,
      );

      expect(metadata).toEqual({
        title: "Standard Test Title",
        description: "Standard test description",
        author: "Bob Wilson",
        thumbnail: null,
        publishedAt: null,
      });
    });

    it("should handle missing metadata gracefully", async () => {
      const html = "<html><head></head><body></body></html>";

      const metadata = await extract.extractMetadata(
        "https://example.com",
        html,
      );

      expect(metadata).toEqual({
        title: null,
        description: null,
        author: null,
        thumbnail: null,
        publishedAt: null,
      });
    });

    it("should throw ExtractError for invalid HTML", async () => {
      const invalidHtml = "not html at all";

      await expect(
        extract.extractMetadata("https://example.com", invalidHtml),
      ).rejects.toThrow(ExtractError);
    });
  });
});
