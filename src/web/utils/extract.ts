import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

export class MetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetadataError";
  }
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

turndown.addRule("picture", {
  filter: ["picture"],
  replacement: function (content, node) {
    const img = node.querySelector("img");
    if (!img) return "";

    const parentAnchor = (node as Element).closest("a");
    const href = parentAnchor?.getAttribute("href");

    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    const title = img.getAttribute("title")
      ? ` "${img.getAttribute("title")}"`
      : "";

    if (href) {
      return `[![${alt}](${src}${title}) ](${href})`;
    }

    return `![${alt}](${src}${title})`;
  },
});

interface JsonLdArticle {
  "@type": "Article" | "NewsArticle";
  headline?: string;
  description?: string;
  author?: { name: string } | string;
  image?: string;
  datePublished?: string;
}

export interface ExtractedMetadata {
  author: string | null;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  publishedAt: Date | null;
}

export class Extract {
  private getMetaContent(doc: Document, selectors: string[]): string | null {
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      const content = element?.getAttribute("content") || element?.textContent;
      if (content?.trim()) {
        return content.trim();
      }
    }
    return null;
  }

  private extractJsonLd(doc: Document): JsonLdArticle | null {
    const script = doc.querySelector('script[type="application/ld+json"]');
    if (!script?.textContent) return null;
    try {
      const data = JSON.parse(script.textContent);
      return data["@type"] === "Article" || data["@type"] === "NewsArticle"
        ? (data as JsonLdArticle)
        : null;
    } catch {
      return null;
    }
  }

  async extractMetadata(url: string, html: string): Promise<ExtractedMetadata> {
    try {
      if (!html.trim() || !html.includes("<") || !html.includes(">")) {
        throw new Error("Invalid HTML: cannot parse content");
      }

      const dom = new JSDOM(html);
      const { document } = dom.window;

      if (!document.documentElement || !document.head) {
        throw new Error("Invalid HTML: missing required elements");
      }

      const jsonLd = this.extractJsonLd(document);

      const title =
        this.getMetaContent(document, [
          'meta[property="og:title"]',
          'meta[name="twitter:title"]',
          'meta[name="title"]',
        ]) ||
        document.title ||
        jsonLd?.headline ||
        null;

      const description =
        this.getMetaContent(document, [
          'meta[property="og:description"]',
          'meta[name="twitter:description"]',
          'meta[name="description"]',
        ]) ||
        jsonLd?.description ||
        null;

      const jsonLdAuthor = jsonLd?.author
        ? typeof jsonLd.author === "string"
          ? jsonLd.author
          : jsonLd.author.name
        : null;

      const author =
        this.getMetaContent(document, [
          'meta[property="article:author"]',
          'meta[name="author"]',
        ]) ||
        jsonLdAuthor ||
        null;

      const thumbnail =
        this.getMetaContent(document, [
          'meta[property="og:image"]',
          'meta[name="twitter:image"]',
          'meta[property="og:image:url"]',
        ]) ||
        jsonLd?.image ||
        null;

      const publishedAt =
        this.getMetaContent(document, [
          'meta[property="article:published_time"]',
          'meta[name="published_time"]',
          'meta[property="og:published_time"]',
        ]) ||
        jsonLd?.datePublished ||
        null;

      return {
        title,
        description,
        author,
        thumbnail,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new MetadataError(`Failed to extract metadata: ${error.message}`);
      } else {
        throw new MetadataError(`Unknown error while extracting metadata`);
      }
    }
  }

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

export const extract = new Extract();

export const extractMainContentAsMarkdown =
  extract.extractMainContentAsMarkdown.bind(extract);
export const extractMetadata = extract.extractMetadata.bind(extract);
