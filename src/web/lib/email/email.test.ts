import { extractMetadataFromEmail, extractUrlFromEmail } from ".";
import type { Email } from "./types";

function makeTestEmail(
  senderAddress: string,
  senderName: string,
  subject: string,
  content: string,
  headers: Record<string, string> = {},
  htmlContent?: string,
): Email {
  return {
    recipient: "test@mail.curi.ooo",
    sender: { address: senderAddress, name: senderName },
    subject,
    content,
    textContent: content,
    htmlContent,
    headers: new Map(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
    ),
  };
}

describe("@/lib/email", () => {
  // TODO: Add tests
  // describe("parseIncomingEmail", () => {});

  describe("extractUrlFromEmail", () => {
    it("should extract URL from List-Post header with various formats", () => {
      const formats = [
        "https://blog.example.com/post",
        "<https://blog.example.com/post>",
        " https://blog.example.com/post ", // with whitespace
        "<https://blog.example.com/post> ",
      ];

      for (const format of formats) {
        const result = extractUrlFromEmail(
          makeTestEmail(
            "sender@example.com",
            "Sender Name",
            "Test Subject",
            "Some content",
            { "List-Post": format },
          ),
        );
        expect(result).toBe("https://blog.example.com/post");
      }
    });

    it("should match URLs based on root domain", () => {
      // Should match different subdomains of same root domain
      expect(
        extractUrlFromEmail(
          makeTestEmail(
            "news@blog.medium.com",
            "Sender Name",
            "Test Subject",
            "Some content",
            { "List-Post": "https://writers.medium.com/post" },
          ),
        ),
      ).toBe("https://writers.medium.com/post");

      // Should match special TLD cases
      expect(
        extractUrlFromEmail(
          makeTestEmail(
            "news@site.co.uk",
            "Sender Name",
            "Test Subject",
            "Some content",
            { "List-Post": "https://blog.site.co.uk/post" },
          ),
        ),
      ).toBe("https://blog.site.co.uk/post");

      // Should match root domain in content search
      const result = extractUrlFromEmail(
        makeTestEmail(
          "news@blog.substack.com",
          "Sender Name",
          "Weekly Tech Update: AI Revolution",
          `Check these out:
https://newsletter.substack.com/tech-weekly/ai-revolution
https://different-domain.com/post`,
        ),
      );
      expect(result).toBe(
        "https://newsletter.substack.com/tech-weekly/ai-revolution",
      );

      // Should not match different root domains
      const noMatchResult = extractUrlFromEmail(
        makeTestEmail(
          "news@blog.medium.com",
          "Sender Name",
          "Weekly Update",
          `Check these out:
https://substack.com/weekly-update
https://different-domain.com/post`,
        ),
      );
      expect(noMatchResult).toBe(
        "https://curio-newsletter/blog-medium-com/weekly-update",
      );
    });

    it("should find URL with most matching words from subject", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "news@substack.com",
          "Sender Name",
          "Weekly Tech Update: AI Revolution",
          `Check these out:
https://substack.com/unrelated-post-update
https://substack.com/another-post-weekly
https://other-site.com
Read this article at:
https://substack.com/tech-weekly/ai-revolution
`,
        ),
      );
      expect(result).toBe("https://substack.com/tech-weekly/ai-revolution");
    });

    it("should find URL with most matching words even if not in order", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "news@substack.com",
          "Sender Name",
          "Weekly Tech Deep Dive",
          `Check these out:
https://substack.com/random-tech
https://substack.com/weekly-tech-content
https://substack.com/deep-weekly-tech-dive
`,
        ),
      );
      expect(result).toBe("https://substack.com/deep-weekly-tech-dive");
    });

    it("should ignore unrelated URLs from the same domain", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "news@medium.com",
          "Sender Name",
          "Unrelated Subject",
          `Visit https://medium.com/blog/post1
Or https://other-site.com`,
        ),
      );
      expect(result).toBe(
        "https://curio-newsletter/medium-com/unrelated-subject",
      );
    });

    it("should generate fallback URL when no matches found", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "newsletter@company.com",
          "Sender Name",
          "Important Update About Our Product",
          "Content with no URLs",
        ),
      );
      expect(result).toBe(
        "https://curio-newsletter/company-com/important-update-about-our-product",
      );
    });

    it("should handle invalid sender email", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "invalid-email",
          "Sender Name",
          "Test Subject",
          "Some content",
        ),
      );
      expect(result).toBe("https://curio-newsletter/unknown/test-subject");
    });
  });

  describe("extractMetadataFromEmail", () => {
    it("should extract title from subject", () => {
      const result = extractMetadataFromEmail(
        makeTestEmail(
          "sender@example.com",
          "Sender Name",
          "Test Newsletter Subject",
          "Some content",
        ),
      );
      expect(result.title).toBe("Test Newsletter Subject");
    });

    it("should use sender name if available as author", () => {
      const result = extractMetadataFromEmail(
        makeTestEmail("sender@example.com", "John Doe", "Subject", "Content"),
      );
      expect(result.author).toBe("John Doe");
    });

    it("should fall back to sender email as author", () => {
      const result = extractMetadataFromEmail(
        makeTestEmail("sender@example.com", "", "Subject", "Content"),
      );
      expect(result.author).toBe("sender@example.com");
    });

    it("should use receipt date as publishedAt", () => {
      const testDate = new Date("2025-03-12T11:57:13-07:00");
      const result = extractMetadataFromEmail(
        makeTestEmail("sender@example.com", "Sender", "Subject", "Content", {
          date: testDate.toISOString(),
        }),
      );
      expect(result.publishedAt).toEqual(testDate);
    });

    it("should parse string receipt date", () => {
      const dateStr = "Wed, 12 Mar 2025 11:57:13 -0700";
      const result = extractMetadataFromEmail(
        makeTestEmail("sender@example.com", "Sender", "Subject", "Content", {
          date: dateStr,
        }),
      );
      expect(result.publishedAt).toEqual(new Date(dateStr));
    });

    it("should truncate description from plaintext content", () => {
      const longContent = "A ".repeat(30) + "B ".repeat(25);
      const result = extractMetadataFromEmail(
        makeTestEmail("sender@example.com", "Sender", "Subject", longContent),
      );
      expect(result.description!.length).toBe(102); // 99 chars + "..."
      expect(result.description!.endsWith("...")).toBe(true);
    });

    it("should truncate cleaned description from HTML content if plaintext is not available", () => {
      const email = makeTestEmail(
        "sender@example.com",
        "Sender",
        "Subject",
        "",
        {},
        `<div>
        ${"A ".repeat(30)}${"B ".repeat(30)}
        <div>On Wed, Mar 12, 2025 at 11:57 AM John <john@example.com> wrote:</div>
        <blockquote>Previous message content</blockquote>
        <div>Sent from my iPhone</div>
        </div>`,
      );
      const result = extractMetadataFromEmail(email);

      expect(result.description!.length).toBeLessThanOrEqual(103);
      expect(result.description!.endsWith("...")).toBe(true);
      expect(result.description!).not.toContain("wrote:");
      expect(result.description!).not.toContain("Sent from my");
      expect(result.description!).not.toContain("Previous message");
    });
  });
});
