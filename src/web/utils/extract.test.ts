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
});
