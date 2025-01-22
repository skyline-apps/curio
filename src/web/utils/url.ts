import { createHash } from "crypto";

/**
 * Removes query parameters from a URL and returns the cleaned URL
 */
export function cleanUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch (error) {
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
 * Generates a deterministic slug from a URL by:
 * 1. Removing query parameters
 * 2. Taking the domain and longest path component (limited to 7 words each)
 * 3. Creating a hash of the original URL
 * 4. Combining the components with the hash
 */
export function generateSlug(url: string): string {
  try {
    const cleanedUrl = cleanUrl(url);
    const parsedUrl = new URL(cleanedUrl);
    // Get domain without protocol and www, limit to 7 words
    const domain = truncateWords(
      parsedUrl.host.replace(/^www\./, "").replace(/\./g, "-"),
      7,
    );
    // Get the longest path component and limit to 7 words
    const path = parsedUrl.pathname.replace(/\/+$/, "");
    const longestPathComponent = getLongestPathComponent(path).replace(
      /\//g,
      "-",
    );
    const slugBase = truncateWords(longestPathComponent, 7);

    // Create a hash of the cleaned URL
    const hash = createHash("sha256")
      .update(cleanedUrl)
      .digest("hex")
      .slice(0, 6);

    return slugBase ? `${domain}-${slugBase}-${hash}` : `${domain}-${hash}`;
  } catch (error) {
    // If URL parsing fails, hash the entire URL
    const hash = createHash("sha256").update(url).digest("hex").slice(0, 8);
    return `item-${hash}`;
  }
}
