import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

turndownService.addRule("images", {
  filter: "img",
  replacement: (_content: string, node: Node) => {
    if (!(node instanceof HTMLElement)) return "";
    const src = node.getAttribute("src");
    const alt = node.getAttribute("alt") || "";
    return src ? `![${alt}](${src})` : "";
  },
});

export class Extract {
  async extractMainContentAsMarkdown(url: string): Promise<string> {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html, { url });

    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article) {
      throw new ExtractError("Failed to extract content");
    }

    return turndownService.turndown(article.content);
  }
}

// Export singleton instance
export const extract = new Extract();

// Export individual methods for convenience
export const { extractMainContentAsMarkdown } = extract;
