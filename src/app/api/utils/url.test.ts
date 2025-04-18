import { FALLBACK_HOSTNAME } from "@app/schemas/types";
import { describe, expect, it } from "vitest";

import { cleanUrl, generateSlug, getRootDomain, slugifyString } from "./url";

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

    it("removes query parameters from path URL", () => {
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
      expect(generateSlug("https://example.com")).toMatch(
        /^example-com-[a-f0-9]{6}$/,
      );
      expect(generateSlug("https://example.com/")).toMatch(
        /^example-com-[a-f0-9]{6}$/,
      );
      expect(generateSlug("https://example.com/path")).toMatch(
        /^example-com-path-[a-f0-9]{6}$/,
      );
    });

    it("handles URLs with query parameters", () => {
      expect(generateSlug("https://example.com?query=value")).toMatch(
        /^example-com-[a-f0-9]{6}$/,
      );
      expect(generateSlug("https://example.com#fragment")).toMatch(
        /^example-com-[a-f0-9]{6}$/,
      );
    });

    it("handles URLs with query parameters in path", () => {
      expect(generateSlug("https://example.com/path?query=value")).toMatch(
        /^example-com-path-[a-f0-9]{6}$/,
      );
      expect(generateSlug("https://example.com/path#fragment")).toMatch(
        /^example-com-path-[a-f0-9]{6}$/,
      );
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

    it("ignores FALLBACK_HOSTNAME from email newsletters", () => {
      const url = `https://${FALLBACK_HOSTNAME}/medium-com/this-is-my-article-with-a-very-long-title`;
      const slug = generateSlug(url);
      expect(slug).toMatch(
        /^medium-com-this-is-my-article-with-a-very-[a-f0-9]{6}$/,
      );
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

    it("ignores curio-newsletter URLs", () => {
      const url = "https://curio-newsletter/example-com/my-newsletter";
      expect(generateSlug(url)).toMatch(
        /^example-com-my-newsletter-[a-f0-9]{6}$/,
      );

      const urlWithQuery =
        "https://curio-newsletter/example-com/my-newsletter?utm_source=email";
      expect(generateSlug(urlWithQuery)).toMatch(
        /^example-com-my-newsletter-[a-f0-9]{6}$/,
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

  describe("slugifyString", () => {
    it("converts to lowercase and appends hash", () => {
      expect(slugifyString("Hello World")).toMatch(/^hello-world-[a-f0-9]{6}$/);
      expect(slugifyString("UPPER CASE")).toMatch(/^upper-case-[a-f0-9]{6}$/);
    });

    it("replaces spaces with hyphens", () => {
      expect(slugifyString("multiple   spaces")).toMatch(
        /^multiple-spaces-[a-f0-9]{6}$/,
      );
      expect(slugifyString("tabs	and spaces")).toMatch(
        /^tabs-and-spaces-[a-f0-9]{6}$/,
      );
    });

    it("removes special characters", () => {
      expect(slugifyString("special!@#$%^&*()")).toMatch(
        /^special-[a-f0-9]{6}$/,
      );
      expect(slugifyString("punctuation.,;:'\"[]{}\\|")).toMatch(
        /^punctuation-[a-f0-9]{6}$/,
      );
      expect(slugifyString("Newsletter: My Day's Newsletter")).toMatch(
        /^newsletter-my-day-s-newsletter-[a-f0-9]{6}$/,
      );
    });

    it("handles non-ASCII characters", () => {
      expect(slugifyString("café")).toMatch(/^cafe-[a-f0-9]{6}$/);
      expect(slugifyString("über")).toMatch(/^uber-[a-f0-9]{6}$/);
      expect(slugifyString("piñata")).toMatch(/^pinata-[a-f0-9]{6}$/);
    });

    it("handles complex Unicode that can't be slugified", () => {
      expect(slugifyString("emoji 🎉")).toMatch(/^emoji-[a-f0-9]{6}$/);
      expect(slugifyString("symbols ♠♣♥♦")).toMatch(
        /^symbols-[a-f0-9]{6}$/,
      );
    });

    it("removes leading and trailing hyphens", () => {
      expect(slugifyString("-leading-")).toMatch(/^leading-[a-f0-9]{6}$/);
      expect(slugifyString("--multiple--hyphens--")).toMatch(
        /^multiple-hyphens-[a-f0-9]{6}$/,
      );
    });

    it("collapses multiple hyphens", () => {
      expect(slugifyString("multiple---hyphens")).toMatch(
        /^multiple-hyphens-[a-f0-9]{6}$/,
      );
      expect(slugifyString("double--hyphens")).toMatch(
        /^double-hyphens-[a-f0-9]{6}$/,
      );
    });

    it("truncates to 7 parts", () => {
      const longInput = "one two three four five six seven eight nine ten";
      expect(slugifyString(longInput)).toMatch(
        /^one-two-three-four-five-six-seven-[a-f0-9]{6}$/,
      );
    });

    it("generates consistent hash for same input", () => {
      const input = "Hello World";
      const slug1 = slugifyString(input);
      const slug2 = slugifyString(input);
      expect(slug1).toBe(slug2);
    });

    it("generates distinct slugs for youtube links", () => {
      const slug1 = generateSlug("https://www.youtube.com/watch?v=1234567890");
      const slug2 = generateSlug("https://www.youtube.com/watch?v=9876543210");
      expect(slug1).not.toBe(slug2);
    });
  });

  describe("getRootDomain", () => {
    it("extracts root domain from simple hostname", () => {
      expect(getRootDomain("example.com")).toBe("example.com");
      expect(getRootDomain("subdomain.example.com")).toBe("example.com");
      expect(getRootDomain("deep.sub.example.com")).toBe("example.com");
    });

    it("handles special TLD cases correctly", () => {
      // .co.uk domains
      expect(getRootDomain("example.co.uk")).toBe("example.co.uk");
      expect(getRootDomain("sub.example.co.uk")).toBe("example.co.uk");

      // .com.au domains
      expect(getRootDomain("example.com.au")).toBe("example.com.au");
      expect(getRootDomain("blog.example.com.au")).toBe("example.com.au");

      // .co.jp domains
      expect(getRootDomain("example.co.jp")).toBe("example.co.jp");
      expect(getRootDomain("news.example.co.jp")).toBe("example.co.jp");
    });

    it("handles single-level domains", () => {
      expect(getRootDomain("localhost")).toBe("localhost");
      expect(getRootDomain("internal")).toBe("internal");
    });

    it("handles two-level domains", () => {
      expect(getRootDomain("example.com")).toBe("example.com");
      expect(getRootDomain("example.org")).toBe("example.org");
      expect(getRootDomain("example.net")).toBe("example.net");
    });

    it("ignores curio-newsletter domain", () => {
      expect(getRootDomain("curio-newsletter")).toBe("curio-newsletter");
    });
  });
});
