import { MOCK_ENV } from "@app/api/utils/test/env";
import { TextDirection } from "@app/schemas/db";
import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";

import {
  extractMetadataFromEmail,
  extractUrlFromEmail,
  isVerificationEmail,
  parseIncomingEmail,
} from ".";
import type { Email } from "./types";

function makeTestEmail(
  senderAddress: string,
  senderName: string,
  subject: string,
  content: string,
  headers: Record<string, string>[] = [],
  htmlContent?: string,
): Email {
  return {
    recipient: "test@mail.curi.ooo",
    sender: { address: senderAddress, name: senderName },
    subject,
    content,
    textContent: content,
    htmlContent,
    headers,
  };
}

vi.unmock("@app/api/lib/email");

describe("@app/api/lib/email", () => {
  const fixturesPath = path.join(process.cwd(), "api/test/fixtures");

  describe("parseIncomingEmail", () => {
    it("should parse raw email with single recipient", async () => {
      const email = fs.readFileSync(
        path.join(fixturesPath, "email-single.txt"),
        "utf-8",
      );
      const parsedEmail = await parseIncomingEmail(
        MOCK_ENV.CURIO_EMAIL_DOMAIN,
        email,
      );
      expect(parsedEmail).toBeDefined();
      expect(parsedEmail!.recipient).toBe("test@testmail.curi.ooo");
      expect(parsedEmail!.subject).toBe("Test email");
      expect(parsedEmail!.sender).toEqual({
        address: "sender@sender.com",
        name: "Test Sender",
      });
      expect(parsedEmail!.htmlContent).toBe(
        '<div dir="ltr">This is my email newsletter<div><br></div><div><ol><li style="margin-left:15px">Item 1</li><li style="margin-left:15px">Item 2</li><li style="margin-left:15px">Item 3</li></ol><div><br></div></div><div>Thanks!</div></div>\n\n',
      );
      expect(parsedEmail!.textContent).toBe(
        "This is my email newsletter\n" +
          "\n" +
          "\n" +
          "   1. Item 1\n" +
          "   2. Item 2\n" +
          "   3. Item 3\n" +
          "\n" +
          "\n" +
          "Thanks!\n\n",
      );
      expect(parsedEmail!.textContent).toEqual(parsedEmail!.content);
      expect(
        parsedEmail!.headers.find((header) => header.key === "mime-version")
          ?.value,
      ).toBe("1.0");
    });

    it("should parse raw email with multiple recipients", async () => {
      const email = fs.readFileSync(
        path.join(fixturesPath, "email-multiple.txt"),
        "utf-8",
      );
      const parsedEmail = await parseIncomingEmail(
        MOCK_ENV.CURIO_EMAIL_DOMAIN,
        email,
      );
      expect(parsedEmail).toBeDefined();
      expect(parsedEmail!.recipient).toBe("test@testmail.curi.ooo");
      expect(parsedEmail!.subject).toBe("Test multiple recipients");
      expect(parsedEmail!.sender).toEqual({
        address: "sender@sender.com",
        name: "Test Sender",
      });
      expect(parsedEmail!.htmlContent?.length).toBeGreaterThan(0);
      expect(parsedEmail!.textContent?.length).toBeGreaterThan(0);
    });

    it("should parse email with url in headers", async () => {
      const email = fs.readFileSync(
        path.join(fixturesPath, "email-headers.txt"),
        "utf-8",
      );
      const parsedEmail = await parseIncomingEmail(
        MOCK_ENV.CURIO_EMAIL_DOMAIN,
        email,
      );
      expect(
        parsedEmail!.headers.find((header) => header.key === "list-post")
          ?.value,
      ).toBe("<https://www.sender.com/p/another-test-newsletter>");
    });

    it("should parse forwarded email", async () => {
      const email = fs.readFileSync(
        path.join(fixturesPath, "email-forwarded.txt"),
        "utf-8",
      );
      const parsedEmail = await parseIncomingEmail(
        MOCK_ENV.CURIO_EMAIL_DOMAIN,
        email,
      );
      expect(parsedEmail).toBeDefined();
      expect(parsedEmail!.recipient).toBe("test@testmail.curi.ooo");
      expect(parsedEmail!.subject).toBe("My newsletter forwarded");
      expect(parsedEmail!.sender).toEqual({
        address: "testnewsletter@substack.com",
        name: "Test Newsletter",
      });
      expect(parsedEmail!.htmlContent).toBe(
        '<div dir="ltr"><br><br><div class="gmail_quote gmail_quote_container"><p>Newsletter content: link to <a href="https://testnewsletter.substack.com/p/my-newsletter-forwarded?ref=newsletter">original</a></p><br></div></div>\n\n',
      );
      expect(parsedEmail!.textContent).toBe(
        "\nNewsletter content: link to original (https://testnewsletter.substack.com/p/my-newsletter-forwarded?ref=newsletter)\n\n",
      );
    });
  });

  describe("extractUrlFromEmail", () => {
    it("should extract URL from List-Post header parsed into object", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "sender@example.com",
          "Sender Name",
          "This is my new post",
          "Some content",
          [{ key: "list-post", value: "<https://blog.example.com/post>" }],
        ),
      );
      expect(result).toBe("https://blog.example.com/post");
    });

    it("should ignore List-Post header if doesn't match subject", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "sender@example.com",
          "Sender Name",
          "Test Subject",
          "Some content",
          [{ key: "list-post", value: "<https://blog.example.com/post>" }],
        ),
      );
      expect(result).toBe("https://curio-newsletter/example-com/test-subject");
    });

    it("should match URLs based on root domain", () => {
      // Should match different subdomains of same root domain
      expect(
        extractUrlFromEmail(
          makeTestEmail(
            "news@blog.medium.com",
            "Sender Name",
            "Test Post",
            "Some content",
            [{ key: "list-post", value: "<https://writers.medium.com/post>" }],
          ),
        ),
      ).toBe("https://writers.medium.com/post");

      // Should match special TLD cases
      expect(
        extractUrlFromEmail(
          makeTestEmail(
            "news@site.co.uk",
            "Sender Name",
            "Test Post",
            "Some content",
            [{ key: "list-post", value: "<https://blog.site.co.uk/post>" }],
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

    it("should ignore matching words in query parameters", () => {
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
https://substack.com?newsletter=tech-weekly&post=ai-revolution
`,
        ),
      );
      expect(result).toBe("https://substack.com/another-post-weekly");
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

    it("should strip query parameters from email", () => {
      const result = extractUrlFromEmail(
        makeTestEmail(
          "news@substack.com",
          "Sender Name",
          "Weekly Tech Update: AI Revolution",
          `Check these out:
https://substack.com/tech-weekly/ai-revolution?param1=value1
https://substack.com/another-post-weekly?param2=value2
`,
        ),
      );
      expect(result).toBe("https://substack.com/tech-weekly/ai-revolution");
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
        makeTestEmail("sender@example.com", "Sender", "Subject", "Content", [
          { key: "date", value: testDate.toISOString() },
        ]),
      );
      expect(result.publishedAt).toEqual(testDate);
    });

    it("should parse string receipt date", () => {
      const dateStr = "Wed, 12 Mar 2025 11:57:13 -0700";
      const result = extractMetadataFromEmail(
        makeTestEmail("sender@example.com", "Sender", "Subject", "Content", [
          { key: "date", value: dateStr },
        ]),
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
        [],
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

    it("should set text attributes on Japanese", () => {
      const result = extractMetadataFromEmail(
        makeTestEmail(
          "sender@example.com",
          "Sender",
          "Subject",
          "これは日本語のメールです",
        ),
      );
      expect(result.textDirection).toBe(TextDirection.LTR);
      expect(result.textLanguage).toBe("ja");
    });

    it("should detect rtl characters on Hebrew and set text attributes", () => {
      const result = extractMetadataFromEmail(
        makeTestEmail(
          "sender@example.com",
          "Sender",
          "Subject",
          "זה כתב עברי Email",
        ),
      );
      expect(result.textDirection).toBe(TextDirection.RTL);
      expect(result.textLanguage).toBe("he");
    });

    it("should detect rtl characters on Arabic and set text attributes", () => {
      const result = extractMetadataFromEmail(
        makeTestEmail(
          "sender@example.com",
          "Sender",
          "Subject",
          "بريدي الإلكتروني باللغة العربية",
        ),
      );
      expect(result.textDirection).toBe(TextDirection.RTL);
      expect(result.textLanguage).toBe("ar");
    });
  });

  describe("isVerificationEmail", () => {
    it("should return true for verification emails", () => {
      const matchingSubjects = [
        "Complete your sign up to News Weekly",
        "Finish your sign-up",
        "Finish signing up for our newsletter",
        "Verify your News Weekly email",
        "Confirm your subscription to News Weekly",
      ];
      for (const subject of matchingSubjects) {
        const email = makeTestEmail(
          "sender@example.com",
          "Sender",
          subject,
          "Some content",
        );
        expect(isVerificationEmail(email)).toBe(true);
      }
    });

    it("should return false for regular emails", () => {
      const matchingSubjects = [
        "Today in News Weekly",
        "The latest in chip verification",
        "Signs of a slowing market",
        "Racing towards completion",
        "Subscription-based services are coming back",
      ];
      for (const subject of matchingSubjects) {
        const email = makeTestEmail(
          "sender@example.com",
          "Sender",
          subject,
          "Some content",
        );
        expect(isVerificationEmail(email)).toBe(false);
      }
    });
  });
});
