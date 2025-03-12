import { type ParsedMail, simpleParser } from "mailparser";

import { ExtractedMetadata } from "@/lib/extract/types";
import { createLogger } from "@/utils/logger";
import { FALLBACK_HOSTNAME, getRootDomain } from "@/utils/url";

import {
  type Email,
  EmailError,
  type EmailHeaders,
  type HeaderValue,
} from "./types";

export const CURIO_EMAIL_DOMAIN = process.env.CURIO_EMAIL_DOMAIN || "";

const log = createLogger("lib/email");

function domainsMatch(domain1: string, domain2: string): boolean {
  return getRootDomain(domain1) === getRootDomain(domain2);
}

function extractHeaderString(header: HeaderValue | null): string | null {
  if (!header) return null;
  if (typeof header === "string") {
    return header;
  }
  if (Array.isArray(header)) {
    if (header.length === 0) return null;
    const first = header[0];
    if (typeof first === "string") {
      return first;
    }
    return null;
  }
  if (typeof header === "object" && header !== null && "value" in header) {
    const value = header.value;
    if (typeof value === "string") {
      return value;
    }
    return null;
  }
  return header.toString();
}

function extractUrlFromHeaders(
  senderDomain: string,
  headers: EmailHeaders,
): string | null {
  const listPostHeader = headers.get("list-post");
  if (!listPostHeader) return null;

  const listPost = extractHeaderString(listPostHeader);
  if (listPost) {
    // Extract URL from List-Post, handling various formats
    const urlMatch = listPost.match(/<?([^<>\s]+)>?/);
    if (urlMatch && urlMatch[1].startsWith("http")) {
      const url = urlMatch[1];
      // Verify the URL matches the sender domain
      try {
        const urlDomain = new URL(url).hostname.toLowerCase();
        if (domainsMatch(urlDomain, senderDomain)) {
          return url;
        }
      } catch {
        // Invalid URL, continue to other methods
        return null;
      }
    }
  }
  return null;
}

function generateFallbackUrl(senderAddress: string, subject: string): string {
  const slugDomain = (
    senderAddress.split("@")[1]?.toLowerCase() || "unknown"
  ).replace(/\./g, "-");
  const slug = subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://${FALLBACK_HOSTNAME}/${slugDomain}/${slug}`;
}

export async function parseIncomingEmail(
  mimeEmail: string,
): Promise<Email | null> {
  if (!CURIO_EMAIL_DOMAIN) {
    throw new EmailError("CURIO_EMAIL_DOMAIN is not set");
  }

  return simpleParser(mimeEmail)
    .then((parsed: ParsedMail) => {
      const recipient = Array.isArray(parsed.to)
        ? parsed.to
            .find((r) =>
              r.value.some((addr) =>
                addr.address?.includes(CURIO_EMAIL_DOMAIN),
              ),
            )
            ?.value.find((addr) => addr.address?.includes(CURIO_EMAIL_DOMAIN))
            ?.address
        : parsed.to?.value.find((addr) =>
            addr.address?.includes(CURIO_EMAIL_DOMAIN),
          )?.address;

      if (!recipient) {
        throw new EmailError("Invalid recipient");
      }

      const sender = parsed.from?.value[0];
      if (!sender || !sender.address) {
        throw new EmailError("Invalid sender");
      }

      return {
        recipient,
        sender: { address: sender.address, name: sender.name },
        subject: parsed.subject || "",
        htmlContent: parsed.html ? parsed.html : parsed.textAsHtml || undefined,
        textContent: parsed.text,
        content: parsed.text || parsed.html || "",
        headers: parsed.headers || new Map(),
      };
    })
    .catch((err) => {
      log.error("Failed to parse email", { err });
      throw new EmailError("Failed to parse email");
    });
}

/**
 * Estimate the source URL of the email newsletter according to a few heuristics:
 * 1. Commonly used email headers to indicate the source post
 * 2. Searching across links in the email content for posts that match the sending domain and significant parts of the subject
 * 3. Generating a fake URL like "https://invalid/{slugified domain and subject}"
 */
export function extractUrlFromEmail({
  sender,
  subject,
  content,
  headers,
}: Email): string {
  const senderAddress = sender.address;
  // Extract sender domain for validation
  const senderDomain = senderAddress.split("@")[1]?.toLowerCase();
  if (!senderDomain) {
    return generateFallbackUrl(senderAddress, subject);
  }

  // 1. Check List-Post header
  const urlFromHeaders = extractUrlFromHeaders(senderDomain, headers);
  if (urlFromHeaders) {
    return urlFromHeaders;
  }

  // 2. Search for matching links in content
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  const matches = content.match(urlRegex);
  if (matches) {
    // Score URLs based on matching words from subject
    const words = subject
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3); // Only consider meaningful words

    let bestUrl = null;
    let bestScore = 0;

    for (const url of matches) {
      try {
        const urlDomain = new URL(url).hostname.toLowerCase();
        if (!domainsMatch(urlDomain, senderDomain)) continue;

        const urlLower = url.toLowerCase();
        const matchingWords = words.filter((word) => urlLower.includes(word));
        const score = matchingWords.length;

        if (score > bestScore) {
          bestScore = score;
          bestUrl = url;
        }
      } catch {
        // Invalid URL, skip it
        continue;
      }
    }

    if (bestUrl) {
      return bestUrl;
    }
  }

  // 3. Generate fallback URL
  return generateFallbackUrl(senderAddress, subject);
}

export function extractMetadataFromEmail({
  sender,
  subject,
  textContent,
  htmlContent,
  headers,
}: Email): ExtractedMetadata {
  const dateHeader = headers.get("date");
  const publishedAt =
    dateHeader instanceof Date
      ? dateHeader
      : typeof dateHeader === "string"
        ? new Date(dateHeader)
        : null;

  let content: string = textContent || "";
  if (!content && htmlContent) {
    content = htmlContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const cleanedContent = content
    .replace(/^\s*>.*$/gm, "") // Remove quoted text
    .replace(/^On.*wrote:$/gm, "") // Remove "On <date>, <sender> wrote:" lines
    .replace(/Sent from my.*$/gm, "") // Remove mobile signatures
    .replace(/--+\s*\n[\s\S]*$/m, "") // Remove signature blocks
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  const snippet = cleanedContent.substring(0, 100).trim();
  return {
    title: subject,
    author: sender.name || sender.address,
    description:
      snippet.length < cleanedContent.length ? snippet + "..." : snippet,
    thumbnail: null,
    favicon: null,
    publishedAt,
  };
}
