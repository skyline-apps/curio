import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Add custom rule for handling picture elements
turndown.addRule("picture", {
  filter: ["picture"],
  replacement: function (content, node) {
    // Find the img element within picture
    const img = node.querySelector("img");
    if (!img) return "";

    // Get parent anchor if it exists
    const parentAnchor = (node as Element).closest("a");
    const href = parentAnchor?.getAttribute("href");

    // Get image attributes
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    const title = img.getAttribute("title")
      ? ` "${img.getAttribute("title")}"`
      : "";

    // If there's a parent anchor, wrap the image in a link
    if (href) {
      return `[![${alt}](${src}${title}) ](${href})`;
    }

    // Otherwise just return the image
    return `![${alt}](${src}${title})`;
  },
});

export class Extract {
  async extractMainContentAsMarkdown(
    url: string,
    html: string,
  ): Promise<string> {
    try {
      const dom = new JSDOM(html, { url });

      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (!article) {
        throw new ExtractError("Failed to extract content");
      }

      return turndown.turndown(article.content);
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}

// Export singleton instance
export const extract = new Extract();

// Export individual methods for convenience
export const { extractMainContentAsMarkdown } = extract;
