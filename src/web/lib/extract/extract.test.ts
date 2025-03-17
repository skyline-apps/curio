import fs from "fs";
import path from "path";
import { vi } from "vitest";

import { TextDirection } from "@/db/schema";
import { Extract } from "@/lib/extract";
import { ExtractError, MetadataError } from "@/lib/extract/types";

vi.unmock("@/lib/extract");

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
      const { content } = await extract.extractMainContentAsMarkdown(
        "http://example.com",
        html,
      );
      const lines = content.split("\n");
      expect(lines[0]).toBe("## Main Content");
      expect(lines[1]).toBe("");
      expect(lines[2]).toBe(
        "This is a simple paragraph with some **bold text**.",
      );
      expect(lines[3]).toBe("");
      expect(lines[4]).toBe("![Test image](http://example.com/test.jpg)");
      expect(lines[5]).toBe("");
      expect(lines[6]).toBe("-   List item 1");
      expect(lines[7]).toBe("-   List item 2");

      expect(content).not.toContain("Menu items that should be ignored");
      expect(content).not.toContain("Footer content that should be ignored");
    });

    it("should handle complex HTML with nested elements and code blocks", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "complex.html"),
        "utf-8",
      );

      const { content } = await extract.extractMainContentAsMarkdown(
        "http://example.com",
        html,
      );

      expect(content).toBe(`## Complex Article

This is a more complex article with _various_ formatting and \`code blocks\`.

\`\`\`
function test() {
    console.log("Hello");
}
\`\`\`

> This is a blockquote with nested content
> 
> -   Nested list item
> -   Another nested item

![Complex test image](http://example.com/complex.jpg)`);

      expect(content).not.toContain("Navigation that should be ignored");
      expect(content).not.toContain("Sidebar content to ignore");
      expect(content).not.toContain("Aside content to ignore");
    });

    it("should extract and convert links to markdown", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "links.html"),
        "utf-8",
      );

      const { content } = await extract.extractMainContentAsMarkdown(
        "http://host.com",
        html,
      );
      const lines = content.split("\n");

      expect(lines[0]).toBe("[Link with href](https://example.com/)  ");
      expect(lines[1]).toBe(
        "[Link with _emphasized text_](https://google.com/)  ",
      );
      expect(lines[2]).toBe("[Link with **strong text**](https://bold.com/)  ");
      expect(lines[3]).toBe(
        "[Link with](https://github.com/) [nested link](https://github.com/)  ",
      );
      expect(lines[4]).toBe("[Link with heading](https://curi.ooo/)  ");
      expect(lines[5]).toBe(
        "[![Test Image](https://example.com/image.jpg)](https://test.com/)  ",
      );
      expect(lines[6]).toBe(
        ' [ ![Test Image](https://example.com/thumb.jpg "Example Title")Extra child](https://picture.com/)  ',
      );
      expect(lines[7]).toBe("");
      expect(lines[8]).toBe("-   [content](http://host.com/content)");
    });

    it("should extract and convert img content to markdown", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "img.html"),
        "utf-8",
      );

      const { content } = await extract.extractMainContentAsMarkdown(
        "http://host.com",
        html,
      );
      const lines = content.split("\n");

      expect(lines[0]).toBe("## My blog pictures");
      expect(lines[1]).toBe("");
      expect(lines[2]).toBe("![with alt text](http://host.com/relative.jpg)  ");
      expect(lines[3]).toBe("![](https://example.com/image.jpg)  ");
      expect(lines[4]).toBe(
        "![Dog](http://host.com/dog.jpg?width=1100&height=825)  ",
      );
      expect(lines[5]).toBe(
        ' ![Test Image](https://example.com/thumb.jpg "Example Title")',
      );
    });

    it("should extract and convert headers to markdown", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "headers.html"),
        "utf-8",
      );

      const { content } = await extract.extractMainContentAsMarkdown(
        "http://host.com",
        html,
      );
      const lines = content.split("\n");

      expect(lines[0]).toBe("## Main Content");
      expect(lines[2]).toBe("## Header [Link](https://example.com/)");
      expect(lines[4]).toBe("### Subheader");
      expect(lines[6]).toBe("#### Subsubheader");
      expect(lines[8]).toBe("##### Subsubsubheader");
      expect(lines[10]).toBe("###### Subsubsubsubheader");
    });

    it("should throw ExtractError when content extraction fails", async () => {
      const invalidHtml = "<html><body></body></html>";

      await expect(
        extract.extractMainContentAsMarkdown("http://example.com", invalidHtml),
      ).rejects.toThrow(ExtractError);
    });

    it("should insert rtl tag when entire html is rtl", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "rtl-html.html"),
        "utf-8",
      );

      const { content } = await extract.extractMainContentAsMarkdown(
        "http://host.com",
        html,
      );
      const lines = content.split("\n");
      expect(lines[0]).toBe('<div dir="rtl">');
      expect(lines[1]).toBe("");
      expect(lines[2]).toBe("## هذه صفحة عربية");
      expect(lines[3]).toBe("");
      expect(lines[4]).toBe("هذه فقرة عربية");
      expect(lines[5]).toBe("");
      expect(lines[6]).toBe("</div>");
    });

    it("should insert rtl tag when body is rtl", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "rtl-body.html"),
        "utf-8",
      );

      const { content } = await extract.extractMainContentAsMarkdown(
        "http://host.com",
        html,
      );
      const lines = content.split("\n");
      expect(lines[0]).toBe('<div dir="rtl">');
      expect(lines[1]).toBe("");
      expect(lines[2]).toBe("## هذه صفحة عربية");
      expect(lines[3]).toBe("");
      expect(lines[4]).toBe("هذه فقرة عربية");
      expect(lines[5]).toBe("");
      expect(lines[6]).toBe("</div>");
    });

    it("should extract nested rtl tags", async () => {
      const html = fs.readFileSync(
        path.join(fixturesPath, "rtl-nested.html"),
        "utf-8",
      );

      const { content } = await extract.extractMainContentAsMarkdown(
        "http://host.com",
        html,
      );
      const lines = content.split("\n");
      expect(lines[0]).toBe('<h2 dir="rtl" >هذه هي اللغة العربية!</h2>');
      expect(lines[1]).toBe("");
      expect(lines[2]).toBe("This is an English opening paragraph.");
      expect(lines[3]).toBe("");
      expect(lines[4]).toBe(
        'This is a paragraph with <span dir="rtl">**عربي.**</span>',
      );
      expect(lines[5]).toBe("");
      expect(lines[6]).toBe('<div dir="rtl" >');
      expect(lines[7]).toBe("");
      expect(lines[8]).toBe("هذه فقرة عربية");
      expect(lines[9]).toBe("");
      expect(lines[10]).toBe("</div>");
      expect(lines[11]).toBe('<div dir="rtl" >');
      expect(lines[12]).toBe("");
      expect(lines[13]).toBe("-   البند 1");
      expect(lines[14]).toBe("-   البند 2");
      expect(lines[15]).toBe("");
      expect(lines[16]).toBe("</div>");
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
        favicon: null,
        author: "John Doe",
        publishedAt: new Date("2024-01-31T08:00:00Z"),
        textDirection: TextDirection.LTR,
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
                "publisher": {
                  "logo": "https://example.com/logo.jpg"
                },
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
        favicon: "https://example.com/logo.jpg",
        author: "Jane Smith",
        publishedAt: new Date("2024-01-31T08:00:00Z"),
        textDirection: TextDirection.LTR,
      });
    });

    it("should extract metadata from JSON-LD lists", async () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              [{
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": "JSON-LD Test Title",
                "description": "JSON-LD test description",
                "image": [
                  "https://example.com/jsonld-image.jpg",
                  "https://example.com/alt-jsonld-image.jpg"
                ],
                "publisher": {
                  "logo": "https://example.com/logo.jpg"
                },
                "author": {
                  "@type": "Person",
                  "name": "Jane Smith"
                },
                "datePublished": "2024-01-31T08:00:00Z"
    }]
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
        favicon: "https://example.com/logo.jpg",
        author: "Jane Smith",
        publishedAt: new Date("2024-01-31T08:00:00Z"),
        textDirection: TextDirection.LTR,
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
        favicon: null,
        publishedAt: null,
        textDirection: TextDirection.LTR,
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
        favicon: null,
        publishedAt: null,
        textDirection: TextDirection.LTR,
      });
    });

    it("should throw MetadataError for invalid HTML", async () => {
      const invalidHtml = "not html at all";

      await expect(
        extract.extractMetadata("https://example.com", invalidHtml),
      ).rejects.toThrow(MetadataError);
    });

    it("should extract 32x32 favicon when available", async () => {
      const html = `
        <html>
          <head>
            <link rel="icon" sizes="16x16" href="/favicon-16.png">
            <link rel="icon" sizes="32x32" href="/favicon-32.png">
            <link rel="icon" sizes="64x64" href="/favicon-64.png">
          </head>
        </html>
      `;
      const { favicon } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(favicon).toBe("https://example.com/favicon-32.png");
    });

    it("should extract any favicon when 32x32 is not available", async () => {
      const html = `
        <html>
          <head>
            <link rel="icon" href="/favicon.png">
          </head>
        </html>
      `;
      const { favicon } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(favicon).toBe("https://example.com/favicon.png");
    });

    it("should extract favicon with relative path", async () => {
      const html = `
        <html>
          <head>
            <link rel="icon" href="./favicon.png">
          </head>
        </html>
      `;
      const { favicon } = await extract.extractMetadata(
        "https://example.com/page",
        html,
      );
      expect(favicon).toBe("https://example.com/page/favicon.png");
    });

    it("should extract favicon with absolute path", async () => {
      const html = `
        <html>
          <head>
            <link rel="icon" href="https://cdn.example.com/favicon.png">
          </head>
        </html>
      `;
      const { favicon } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(favicon).toBe("https://cdn.example.com/favicon.png");
    });

    it("should extract shortcut icon as fallback", async () => {
      const html = `
        <html>
          <head>
            <link rel="shortcut icon" href="/shortcut-favicon.png">
          </head>
        </html>
      `;
      const { favicon } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(favicon).toBe("https://example.com/shortcut-favicon.png");
    });

    it("should return null when no favicon is found", async () => {
      const html = `
        <html>
          <head>
            <title>No Favicon</title>
          </head>
        </html>
      `;
      const { favicon } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(favicon).toBeNull();
    });

    it("should extract text direction from html", async () => {
      const html = `
        <html dir="rtl">
        </html>
      `;
      const { textDirection } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(textDirection).toBe(TextDirection.RTL);
    });

    it("should extract text direction from body", async () => {
      const html = `
        <html>
          <body dir="rtl">
          </body>
        </html>
      `;
      const { textDirection } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(textDirection).toBe(TextDirection.RTL);
    });

    it("should extract text direction from style", async () => {
      const html = `
        <html>
          <head>
            <style>
              body {
                direction: rtl;
              }
            </style>
          </head>
          <body></body>
        </html>
      `;
      const { textDirection } = await extract.extractMetadata(
        "https://example.com",
        html,
      );
      expect(textDirection).toBe(TextDirection.RTL);
    });
  });
});
