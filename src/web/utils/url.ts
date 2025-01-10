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
 * Generates a deterministic slug from a URL by:
 * 1. Removing query parameters
 * 2. Taking the path component
 * 3. Creating a hash of the path
 * 4. Combining the path with the hash
 */
export function generateSlug(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Remove trailing slashes and get the path without query params
    const path = parsedUrl.pathname.replace(/\/+$/, "");
    // Create a hash of the path
    const hash = createHash("sha256").update(path).digest("hex").slice(0, 8);
    // Remove leading slash and replace remaining slashes with dashes
    const slugBase = path.replace(/^\//, "").replace(/\//g, "-");
    return `${slugBase}-${hash}`;
  } catch (error) {
    // If URL parsing fails, hash the entire URL
    const hash = createHash("sha256").update(url).digest("hex").slice(0, 8);
    return `item-${hash}`;
  }
}
