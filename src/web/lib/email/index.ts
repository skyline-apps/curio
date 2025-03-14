import { type ParsedMail, simpleParser } from "mailparser";

import { ExtractedMetadata } from "@/lib/extract/types";
import { createLogger } from "@/utils/logger";
import { cleanUrl, FALLBACK_HOSTNAME, getRootDomain } from "@/utils/url";

import { type Email, EmailError, type EmailHeaders } from "./types";

export const CURIO_EMAIL_DOMAIN = process.env.CURIO_EMAIL_DOMAIN || "";

const log = createLogger("lib/email");

function domainsMatch(domain1: string, domain2: string): boolean {
  return getRootDomain(domain1) === getRootDomain(domain2);
}

function extractUrlFromHeaders(
  headers: EmailHeaders,
  words: string[],
): string | null {
  // https://github.com/nodemailer/mailparser/blob/da665c8dad5662e1d05b93e7e9c68dc7c706b2bd/lib/mail-parser.js#L380-L383
  const listHeader = headers.get("list");
  if (!listHeader) return null;

  // @ts-expect-error https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69199
  const headerUrl = listHeader?.post?.url;
  if (
    headerUrl &&
    headerUrl.startsWith("http") &&
    words.some((word) => headerUrl.toLowerCase().includes(word))
  ) {
    return headerUrl;
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
      if (!parsed) {
        throw new EmailError("Unknown email contents");
      }
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
        throw new EmailError(
          `Invalid recipient, expected ${CURIO_EMAIL_DOMAIN}`,
        );
      }

      // Extract original sender from forwarded email if present
      // Extract and validate the initial sender
      const initialSender = parsed.from?.value[0];
      if (!initialSender?.address) {
        throw new EmailError("Invalid sender");
      }

      // Initialize sender with validated fields
      let sender: { name: string; address: string } = {
        name: initialSender.name || "",
        address: initialSender.address,
      };
      let subject = parsed.subject || "";
      let htmlContent = parsed.html;
      let textContent = parsed.text;

      // Check heuristics for forwarded emails
      if (
        subject.toLowerCase().startsWith("fwd") ||
        subject.toLowerCase().startsWith("[fwd]") ||
        parsed.text?.startsWith("---------- Forwarded message ---------") ||
        (parsed.html &&
          parsed.html.includes("---------- Forwarded message ----------"))
      ) {
        if (subject.toLowerCase().startsWith("fwd: ")) {
          subject = subject.slice(5).trim();
        } else if (subject.toLowerCase().startsWith("[fwd] ")) {
          subject = subject.slice(6).trim();
        }

        // Try to extract original sender from forwarded email
        let originalSender: { name: string; address: string } | null = null;

        // Check for forwarded email pattern in text content first
        if (parsed.text) {
          const textMatch = parsed.text.match(/From:\s*([^<\n]+)\s*<([^>]+)>/);
          if (textMatch) {
            const [, name, address] = textMatch;
            if (name && address) {
              originalSender = {
                name: name.trim(),
                address: address.trim(),
              };
            }
          }
        }
        // Fallback to HTML content if no match in text
        else if (parsed.html) {
          // Match the forwarded email pattern in HTML, handling both mailto: links and plain email addresses
          const htmlMatch = parsed.html.match(
            /From:\s*(?:<([a-z]+)[^>]*>)?([^<]+)(?:<\/([a-z]+)>)?[^<]*(?:<[^>]*>)*[^<]*&lt;([^&]+)&gt;/,
          );
          if (htmlMatch?.[1] && htmlMatch?.[2]) {
            originalSender = {
              name: htmlMatch[1].trim(),
              address: htmlMatch[2].trim(),
            };
          }
        }

        // Use original sender if found, otherwise keep the current sender
        if (originalSender) {
          sender = originalSender;
        }

        // Remove forwarded header from content
        if (htmlContent) {
          // Remove the Gmail forwarded header while preserving the quote container and content
          htmlContent = htmlContent.replace(
            /(<div[^>]*class="gmail_attr">[\s\S]*?<\/div>\s*<br>\s*<br>)/,
            "",
          );
        }

        if (textContent) {
          textContent = textContent.replace(
            /[-]+\s*Forwarded message\s*[-]+[\s\S]*?(?:\n\n|$)/,
            "",
          );
        }
      }

      return {
        recipient,
        sender: { address: sender.address, name: sender.name },
        subject,
        htmlContent: htmlContent || parsed.textAsHtml || undefined,
        textContent: textContent,
        content: textContent || htmlContent || "",
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
  // Extract words from email subject (assume it's title)
  const words = subject
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3); // Only consider meaningful words

  // 1. Check List-Post header
  const urlFromHeaders = extractUrlFromHeaders(headers, words);
  if (urlFromHeaders) {
    return cleanUrl(urlFromHeaders);
  }

  // 2. Search for matching links in content
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  const matches = content.match(urlRegex);
  if (matches) {
    // Score URLs based on matching words from subject

    let bestUrl = null;
    let bestScore = 0;

    for (const url of matches) {
      try {
        const urlDomain = new URL(url).hostname.toLowerCase();
        if (!domainsMatch(urlDomain, senderDomain)) continue;

        const urlLower = cleanUrl(url).toLowerCase();
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
      return cleanUrl(bestUrl);
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
