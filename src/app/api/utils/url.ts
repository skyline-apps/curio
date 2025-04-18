import { FALLBACK_HOSTNAME } from "@app/schemas/types";
import { createHash } from "crypto";
import slugify from "limax";
import punycode from "punycode";

/**
 * Removes query parameters from a URL and returns the cleaned URL
 */
export function cleanUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}${parsedUrl.pathname}`.replace(/\/+$/, "");
  } catch (_error) {
    // If URL parsing fails, return the original URL
    return url;
  }
}

/**
 * Truncates a string to a maximum number of words, joining them with the specified separator
 */
function truncateWords(
  str: string,
  maxWords: number,
  separator: string = "-",
): string {
  return str.split(separator).slice(0, maxWords).join(separator);
}

/**
 * Gets the longest path component between slashes, removing common file extensions
 * only if they appear at the end of the entire path
 */
function getLongestPathComponent(path: string): string {
  const components = path.split("/").filter((p) => p.length > 0);

  if (components.length === 0) return "";

  // Find the longest component first
  let longest = components.reduce((a, b) => (a.length >= b.length ? a : b));

  // Only remove extension if the longest component is at the end of the path
  const isAtEnd = components[components.length - 1] === longest;
  if (isAtEnd) {
    longest = longest.replace(/\.([a-zA-Z0-9]+)$/i, "");
  }

  return longest.replace(/\./g, "-");
}

/**
 * Parses URL components without decoding unicode characters.
 * Returns an object containing hostname and pathname.
 * Note: This is a simplified parser that assumes a well-formed URL.
 */
function parseUrlPreserveUnicode(url: string): {
  hostname: string;
  pathname: string;
} {
  // Match hostname: capture everything between // and the next / or end of string, excluding ? and #
  const hostnameMatch = url.match(/\/\/([^\/\?#]+)/);
  const hostname = hostnameMatch ? hostnameMatch[1] : "";

  // Match pathname: capture everything after hostname until ? or # or end of string
  const pathnameMatch = url.match(/\/\/[^\/]+(\/?[^\?#]*)/);
  const pathname = pathnameMatch ? pathnameMatch[1] : "";

  return { hostname, pathname };
}

/**
 * Generates a deterministic slug from a URL by:
 * 1. Strip URL of query parameters
 * 2. Get the domain (if not FALLBACK_HOSTNAME) and longest path component
 * 3. Take the first 7 words of both domain and path component
 * 4. Join words from domain and longest path component with -
 * 5. Convert characters to ASCII
 * 6. Append a 6-character hash generated from the cleaned URL
 */
export function generateSlug(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const cleanedUrl = cleanUrl(url);

    const { hostname, pathname } = parseUrlPreserveUnicode(url);

    // Generate hash from cleaned URL
    const hash = createHash("sha256")
      .update(cleanedUrl)
      .digest("hex")
      .slice(0, 6);

    // Get domain and longest path component
    const domain =
      hostname === FALLBACK_HOSTNAME
        ? pathname.split("/")[1]
        : hostname.replace(/^www\./, "");
    const longestPath = getLongestPathComponent(pathname);

    // Take first 7 words of both domain and path
    const domainWords = domain.split(/[.-]/).join("-");
    const truncatedDomain = truncateWords(domainWords, 7);
    const truncatedPath = truncateWords(longestPath, 7);

    // Join domain and path with hyphens
    const slug = `${truncatedDomain}-${truncatedPath}`
      .toLowerCase()
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Convert to ASCII
    const asciiSlug = slug
      .split("-")
      .map((part) => {
        const slug = slugify(part);
        if (slug.length === 0) {
          return punycode.encode(part);
        } else {
          return slug;
        }
      })
      .join("-");

    // Include Youtube video
    if (hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      if (videoId) {
        const videoHash = createHash("sha256")
          .update(videoId)
          .digest("hex")
          .slice(0, 6);
        return `${asciiSlug}-${videoId}-${videoHash}`;
      }
    }

    // Append hash
    return `${asciiSlug}-${hash}`;
  } catch (_error) {
    // If URL parsing fails, hash the original URL
    const hash = createHash("sha256").update(url).digest("hex").slice(0, 8);
    return `item-${hash}`;
  }
}

/**
 * Slugifies a string by:
 * 1. Converting to lowercase
 * 2. Replacing non-alphanumeric characters with hyphens
 * 3. Replacing multiple hyphens with a single hyphen
 * 4. Removing leading and trailing hyphens
 * 5. Converting to ASCII
 * 6. Trimming to at most 7 parts
 * 7. Appending a 6-character hash
 */
export function slugifyString(input: string): string {
  // Convert to lowercase
  const lowered = input.toLowerCase();

  // Replace special characters with spaces
  const cleaned = lowered.replace(/[^a-z0-9\s\u00C0-\u017F]/g, " ");

  // Split into words, convert to ASCII, and filter empty strings
  const words = cleaned.split(/\s+/).filter(Boolean);
  const slug = slugify(words.join(" "));

  // Truncate to at most 7 parts
  const truncated = truncateWords(slug, 7);

  // Append hash
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 6);

  return `${truncated}-${hash}`;
}

/**
 * Extract the root domain from a hostname
 * e.g., "blog.example.co.uk" -> "example.co.uk"
 */
export function getRootDomain(hostname: string): string {
  // Handle special cases for known TLDs with additional segments
  const knownTlds = [".co.uk", ".com.au", ".co.jp"];
  for (const tld of knownTlds) {
    if (hostname.endsWith(tld)) {
      const parts = hostname.slice(0, -tld.length).split(".");
      return `${parts[parts.length - 1]}${tld}`;
    }
  }

  // Default case: take last two segments
  const parts = hostname.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
}
