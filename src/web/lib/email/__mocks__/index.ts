import { vi } from "vitest";

import { generateSlug } from "@/utils/url";

export const MOCK_EMAIL_URL =
  "https://substack.com/test-newsletter/weekly-roundup";
export const MOCK_EMAIL_SLUG = generateSlug(MOCK_EMAIL_URL);
export const MOCK_EMAIL_DATE = new Date("2025-01-12T11:57:13-07:00");

export const MOCK_EMAIL = {
  recipient: "test@mail.curi.ooo",
  sender: { address: "newsletter@substack.com", name: "Newsletter Author" },
  subject: "Test Newsletter",
  content: "Test Email Content",
  textContent: "Test Email Text Content",
  htmlContent: "<h1>Test Email HTML Content</h1><p>This is my newsletter</p>",
  headers: new Map(),
};

export const parseIncomingEmail = vi.fn().mockResolvedValue(MOCK_EMAIL);

export const extractUrlFromEmail = vi.fn().mockReturnValue(MOCK_EMAIL_URL);

export const extractMetadataFromEmail = vi.fn().mockReturnValue({
  title: "Test Newsletter",
  author: "Newsletter Author",
  description: "Test Email Text Content",
  thumbnail: null,
  favicon: null,
  publishedAt: MOCK_EMAIL_DATE,
});
