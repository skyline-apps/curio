import { cleanUrl, generateSlug } from "./url";

describe("url", () => {
  describe("cleanUrl", () => {
    it("handles root domains without trailing slashes", () => {
      const url = "https://example.com";
      expect(cleanUrl(url)).toBe("https://example.com");
    });

    it("handles root domains with trailing slashes", () => {
      const url = "https://example.com/";
      expect(cleanUrl(url)).toBe("https://example.com");
    });

    it("handles root domains with query parameters", () => {
      const url = "https://example.com/?query=value";
      expect(cleanUrl(url)).toBe("https://example.com");
    });

    it("removes query parameters from URL", () => {
      const url = "https://example.com/path?query=value";
      expect(cleanUrl(url)).toBe("https://example.com/path");
    });

    it("keeps URL without query parameters unchanged", () => {
      const url = "https://example.com/path";
      expect(cleanUrl(url)).toBe("https://example.com/path");
    });

    it("removes trailing slashes", () => {
      const url = "https://example.com/path/";
      expect(cleanUrl(url)).toBe("https://example.com/path");
    });

    it("returns original string for invalid URLs", () => {
      const invalidUrl = "not-a-url";
      expect(cleanUrl(invalidUrl)).toBe(invalidUrl);
    });
  });

  describe("generateSlug", () => {
    it("generates correct slug format for simple URL", () => {
      const url = "https://example.com/path";
      const slug = generateSlug(url);
      expect(slug).toMatch(/^example-com-path-[a-f0-9]{6}$/);
    });

    it("handles URLs with query parameters", () => {
      const url = "https://example.com/path?query=value";
      const slug = generateSlug(url);
      expect(slug).toMatch(/^example-com-path-[a-f0-9]{6}$/);
    });

    it("removes www from domain", () => {
      const url = "https://www.example.com/path";
      const slug = generateSlug(url);
      expect(slug).toMatch(/^example-com-path-[a-f0-9]{6}$/);
    });

    it("handles trailing slashes", () => {
      const url = "https://example.com/path/";
      const slug = generateSlug(url);
      expect(slug).toMatch(/^example-com-path-[a-f0-9]{6}$/);
    });

    it("generates consistent slugs for same URL", () => {
      const url = "https://example.com/path";
      const slug1 = generateSlug(url);
      const slug2 = generateSlug(url);
      expect(slug1).toBe(slug2);
    });

    it("generates consistent slugs for same URL with different query parameters", () => {
      const url = "https://example.com/path";
      const slug1 = generateSlug(url);
      const slug2 = generateSlug(`${url}?query=value`);
      expect(slug1).toBe(slug2);
    });

    it("handles invalid URLs", () => {
      const invalidUrl = "not-a-url";
      const slug = generateSlug(invalidUrl);
      expect(slug).toMatch(/^item-[a-f0-9]{8}$/);
    });

    it("truncates long domain to 7 words", () => {
      const url =
        "https://this-is-a-very-long-domain-name-that-needs-truncating.com/path";
      const slug = generateSlug(url);
      expect(slug).toMatch(
        /^this-is-a-very-long-domain-name-path-[a-f0-9]{6}$/,
      );
    });

    it("truncates long path to 7 words", () => {
      const url =
        "https://example.com/this-is-a-very-long-path-that-needs-truncating.html";
      const slug = generateSlug(url);
      expect(slug).toMatch(
        /^example-com-this-is-a-very-long-path-that-[a-f0-9]{6}$/,
      );
    });

    it("truncates both long domain and path to 7 words each", () => {
      const url =
        "https://this-is-a-very-long-domain-name-that-needs-truncating.com/this-is-a-very-long-path-that-needs-truncating.html";
      const slug = generateSlug(url);
      expect(slug).toMatch(
        /^this-is-a-very-long-domain-name-this-is-a-very-long-path-that-[a-f0-9]{6}$/,
      );
    });

    it("handles special characters from URL", () => {
      expect(generateSlug("https://example.com/~path?query=value")).toMatch(
        /^example-com-path-[a-f0-9]{6}$/,
      );
    });

    it("uses longest path component for slug", () => {
      const url = "https://url.com/this/is/my/entire-path/preview";
      const slug = generateSlug(url);
      expect(slug).toMatch(/^url-com-entire-path-[a-f0-9]{6}$/);
    });

    it("handles paths with equal length components", () => {
      const url = "https://example.com/path1/path2/path3";
      const slug = generateSlug(url);
      expect(slug).toMatch(/^example-com-path1-[a-f0-9]{6}$/);
    });

    it("truncates long path components to 7 words", () => {
      const url =
        "https://example.com/short/this-is-a-very-long-path-component-that-needs-truncating/end";
      const slug = generateSlug(url);
      expect(slug).toMatch(
        /^example-com-this-is-a-very-long-path-component-[a-f0-9]{6}$/,
      );
    });

    it("removes common file extensions from path", () => {
      expect(generateSlug("https://example.com/path/document.html")).toMatch(
        /^example-com-document-[a-f0-9]{6}$/,
      );

      expect(generateSlug("https://example.com/path/script.JS")).toMatch(
        /^example-com-script-[a-f0-9]{6}$/,
      );

      expect(generateSlug("https://example.com/path/page.php")).toMatch(
        /^example-com-page-[a-f0-9]{6}$/,
      );

      expect(generateSlug("https://example.com/path/component.TSX")).toMatch(
        /^example-com-component-[a-f0-9]{6}$/,
      );
    });

    it("only removes extensions from end of path components", () => {
      expect(generateSlug("https://example.com/file.html/section")).toMatch(
        /^example-com-file-html-[a-f0-9]{6}$/,
      );

      expect(generateSlug("https://example.com/my.website.html")).toMatch(
        /^example-com-my-website-[a-f0-9]{6}$/,
      );
    });

    it("handles real-world examples correctly", () => {
      expect(
        generateSlug(
          "https://www.npr.org/2005/08/08/4785079/always-go-to-the-funeral?utm_source=newsletter",
        ),
      ).toMatch(/^npr-org-always-go-to-the-funeral-[a-f0-9]{6}$/);

      expect(generateSlug("http://timhulsizer.com/cwords/chonk.html")).toMatch(
        /^timhulsizer-com-chonk-[a-f0-9]{6}$/,
      );

      expect(
        generateSlug(
          "https://worksinprogress.co/issue/why-we-didnt-get-a-malaria-vaccine-sooner/",
        ),
      ).toMatch(
        /^worksinprogress-co-why-we-didnt-get-a-malaria-vaccine-[a-f0-9]{6}$/,
      );

      expect(
        generateSlug(
          "https://governsf.substack.com/p/memo-3-so-you-want-to-be-a-supervisor",
        ),
      ).toMatch(/^governsf-substack-com-memo-3-so-you-want-to-be-[a-f0-9]{6}$/);
    });

    it("handles URLs with unicode characters", () => {
      const tests = [
        {
          input: "https://café.com/bücher",
          expected: /^cafe-com-bucher-[a-f0-9]{6}$/,
        },
        {
          input: "https://example.com/你好世界",
          expected: /^example-com-ni3-hao3-shi4-jie4-[a-f0-9]{6}$/,
        },
        {
          input: "https://münich.de/straße/café",
          expected: /^munich-de-strasse-[a-f0-9]{6}$/,
        },
        {
          input: "https://example.com/🐳",
          expected: /^example-com-7o8h-[a-f0-9]{6}$/,
        },
      ];

      for (const test of tests) {
        expect(generateSlug(test.input)).toMatch(test.expected);
      }
    });
  });
});
