import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import {
  Article,
  ImageObject,
  NewsArticle,
  Organization,
  Person,
  Thing,
} from "schema-dts";
import TurndownService, { Node as TurndownNode } from "turndown";

import { TextDirection } from "@/db/schema";

import { ExtractedMetadata, ExtractError, MetadataError } from "./types";

function isElementNode(
  node: TurndownNode | ChildNode | HTMLElement,
): node is HTMLElement {
  return "tagName" in node;
}

const HEADER_TAGS: (keyof HTMLElementTagNameMap)[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

const LIST_CONTAINER_TAGS: (keyof HTMLElementTagNameMap)[] = ["ul", "ol", "dl"];
const LIST_ITEM_TAGS: (keyof HTMLElementTagNameMap)[] = ["li", "dt", "dd"];

const BLOCK_TAGS: (keyof HTMLElementTagNameMap)[] = [
  "p",
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  ...LIST_CONTAINER_TAGS,
  ...LIST_ITEM_TAGS,
  ...HEADER_TAGS,
];

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

const recursivelyRemoveBlockElements = (html: string): string => {
  let resultHtml = "";
  const dom = new JSDOM(html);
  const node = dom.window.document.body;
  for (const child of node.childNodes) {
    if (child.nodeType === 1 && isElementNode(child)) {
      const tag = child.tagName.toLowerCase();
      if (BLOCK_TAGS.includes(tag as keyof HTMLElementTagNameMap)) {
        resultHtml += recursivelyRemoveBlockElements(child.innerHTML);
      } else {
        const attributes = Array.from(child.attributes)
          .map((attr) => `${attr.name}="${attr.value}"`)
          .join(" ");
        resultHtml += `<${tag} ${attributes}>${recursivelyRemoveBlockElements(child.innerHTML)}</${tag}>`;
      }
    } else if (child.nodeType === 3) {
      resultHtml += child.textContent;
    }
  }
  return resultHtml;
};

turndown.addRule("header", {
  filter: HEADER_TAGS,
  replacement: function (content: string, node: TurndownNode) {
    if (isElementNode(node)) {
      const headerLevel = node.tagName.slice(1);
      const cleanedContent = content.replace(/\s+/g, " ").trim();
      return `${"#".repeat(Number(headerLevel))} ${cleanedContent}\n\n`;
    } else {
      return content;
    }
  },
});

turndown.addRule("link", {
  filter: ["a"],
  replacement: function (content: string, node: TurndownNode) {
    let linkText = "";
    if (!isElementNode(node)) return content;
    const href = node.getAttribute("href");
    if (!href) return content;
    const cleanedContent = recursivelyRemoveBlockElements(node.innerHTML);
    linkText += turndown.turndown(cleanedContent);
    return `[${linkText}](${href})`;
  },
});

turndown.addRule("dir", {
  filter: function (node, _options) {
    return node.hasAttribute && node.hasAttribute("dir");
  },
  replacement: function (content, node, _options) {
    if (!isElementNode(node)) return content;
    const dir = node.getAttribute("dir");
    const tag = node.tagName.toLowerCase();
    const otherAttributes = Array.from(node.attributes)
      .filter((attr) => attr.name !== "dir")
      .map((attr) => `${attr.name}="${attr.value}"`)
      .join(" ");
    if (dir === "rtl" || dir === "ltr") {
      if (HEADER_TAGS.includes(tag as keyof HTMLElementTagNameMap)) {
        return `<${tag} dir="${dir}" ${otherAttributes}>${turndown.turndown(node.innerHTML)}</${tag}>`;
      } else if (BLOCK_TAGS.includes(tag as keyof HTMLElementTagNameMap)) {
        return `\n<div dir="${dir}" ${otherAttributes}>\n\n${turndown.turndown(node.innerHTML)}\n\n</div>`;
      } else {
        return `<span dir="${dir}">${turndown.turndown(`<${tag} ${otherAttributes}>${content}</${tag}>`)}</span>`;
      }
    }
    return turndown.turndown(content);
  },
});

type JsonLdGraph = {
  "@context"?: string;
  "@graph"?: Thing[];
  "@type"?: string;
} & Record<string, unknown>;

type ArticleType = (Article | NewsArticle) & {
  author?: string | Person | Organization | (string | Person | Organization)[];
  image?: string | ImageObject | (string | ImageObject)[];
  publisher?: Organization & {
    logo?: string;
  };
};

function isArticle(thing: Thing): thing is ArticleType {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "@type" in thing &&
    (thing["@type"] === "Article" || thing["@type"] === "NewsArticle")
  );
}

function isPerson(thing: unknown): thing is Person & { name?: string } {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "@type" in thing &&
    thing["@type"] === "Person"
  );
}

function isOrganization(
  thing: unknown,
): thing is Organization & { name?: string } {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "@type" in thing &&
    thing["@type"] === "Organization"
  );
}

function isImageObject(
  thing: unknown,
): thing is ImageObject & { url?: string } {
  return (
    typeof thing === "object" &&
    thing !== null &&
    "@type" in thing &&
    thing["@type"] === "ImageObject"
  );
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

  private parseJsonLd(jsonString: string): JsonLdGraph | null {
    try {
      const parsed = JSON.parse(jsonString);
      // Handle both single object and array of objects
      const data = Array.isArray(parsed) ? parsed[0] : parsed;
      return data as unknown as JsonLdGraph;
    } catch {
      return null;
    }
  }

  private extractJsonLd(doc: Document): ArticleType | null {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      if (!script.textContent) continue;

      const jsonLd = this.parseJsonLd(script.textContent);
      if (!jsonLd) continue;

      const items: Thing[] = jsonLd["@graph"] || [jsonLd as unknown as Thing];

      for (const item of items) {
        if (isArticle(item)) {
          return item;
        }
      }
    }

    return null;
  }

  private extractAuthorFromJsonLd(
    article: Article | NewsArticle,
  ): string | null {
    const author = article.author;
    if (!author) return null;

    if (Array.isArray(author)) {
      const firstAuthor = author[0];
      if (typeof firstAuthor === "string") return firstAuthor;
      if (isPerson(firstAuthor)) return firstAuthor.name?.toString() || null;
      if (isOrganization(firstAuthor))
        return firstAuthor.name?.toString() || null;
      return null;
    }

    if (typeof author === "string") return author;
    if (isPerson(author)) return author.name?.toString() || null;
    if (isOrganization(author)) return author.name?.toString() || null;

    return null;
  }

  private extractImageFromJsonLd(
    article: Article | NewsArticle,
  ): string | null {
    const image = article.image;
    if (!image) return null;

    if (Array.isArray(image)) {
      const firstImage = image[0];
      if (typeof firstImage === "string") return firstImage;
      if (isImageObject(firstImage)) return firstImage.url?.toString() || null;
      return null;
    }

    if (typeof image === "string") return image;
    if (isImageObject(image)) return image.url?.toString() || null;

    return null;
  }

  private extractFavicon(doc: Document): string | null {
    const favicon32 = doc.querySelector('link[rel="icon"][sizes="32x32"]');
    if (favicon32) return favicon32.getAttribute("href");

    const faviconShortcut32 = doc.querySelector(
      'link[rel="shortcut icon"][sizes="32x32"]',
    );
    if (faviconShortcut32) return faviconShortcut32.getAttribute("href");

    const faviconAny = doc.querySelector('link[rel="icon"]');
    if (faviconAny) return faviconAny.getAttribute("href");

    const shortcutIcon = doc.querySelector('link[rel="shortcut icon"]');
    if (shortcutIcon) return shortcutIcon.getAttribute("href");

    return null;
  }

  private createAbsoluteUrl(link: string | null, url: string): string | null {
    if (!link) return null;
    if (link.startsWith("http")) {
      return link;
    } else if (link.startsWith("/")) {
      const hostname = new URL(url).hostname;
      return new URL(`https://${hostname}${link}`).toString();
    } else {
      return new URL(`${url}/${link}`).toString();
    }
  }

  async extractMetadata(url: string, html: string): Promise<ExtractedMetadata> {
    try {
      if (!html.trim() || !html.includes("<") || !html.includes(">")) {
        throw new ExtractError("Invalid HTML content");
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
        jsonLd?.headline?.toString() ||
        document.title ||
        null;

      const description =
        this.getMetaContent(document, [
          'meta[property="og:description"]',
          'meta[name="twitter:description"]',
          'meta[name="description"]',
        ]) ||
        jsonLd?.description?.toString() ||
        null;

      const author =
        this.getMetaContent(document, [
          'meta[property="article:author"]',
          'meta[name="author"]',
        ]) ||
        (jsonLd && this.extractAuthorFromJsonLd(jsonLd)) ||
        null;

      const thumbnail =
        this.getMetaContent(document, [
          'meta[property="og:image"]',
          'meta[name="twitter:image"]',
          'meta[property="og:image:url"]',
        ]) ||
        (jsonLd && this.extractImageFromJsonLd(jsonLd)) ||
        null;

      const publishedAt =
        this.getMetaContent(document, [
          'meta[property="article:published_time"]',
          'meta[name="published_time"]',
          'meta[property="og:published_time"]',
        ]) ||
        jsonLd?.datePublished?.toString() ||
        null;

      const favicon =
        this.createAbsoluteUrl(this.extractFavicon(document), url) ||
        (jsonLd?.publisher && "logo" in jsonLd.publisher
          ? jsonLd.publisher.logo
          : null) ||
        null;

      return {
        title,
        description,
        author,
        thumbnail,
        favicon,
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
  ): Promise<{ content: string; textDirection: TextDirection }> {
    try {
      const dom = new JSDOM(html, { url });
      const htmlElement = dom.window.document.querySelector("html");
      const bodyElement = dom.window.document.querySelector("body");
      let documentDir = TextDirection.LTR; // Default to LTR

      if (htmlElement && htmlElement.hasAttribute("dir")) {
        const dir = htmlElement.getAttribute("dir");
        if (dir === "rtl") {
          documentDir = TextDirection.RTL;
        }
      }

      if (bodyElement && bodyElement.hasAttribute("dir")) {
        const dir = bodyElement.getAttribute("dir");
        if (dir === "rtl") {
          documentDir = TextDirection.RTL;
        }
      }

      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (!article) {
        throw new ExtractError("Failed to extract content");
      }

      const content = turndown.turndown(article.content);
      if (documentDir !== "ltr") {
        return {
          content: `<div dir="${documentDir}">\n\n${content}\n\n</div>`,
          textDirection: documentDir,
        };
      }
      return { content, textDirection: documentDir };
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}

export const extract = new Extract();

export const extractMainContentAsMarkdown =
  extract.extractMainContentAsMarkdown.bind(extract);
export const extractMetadata = extract.extractMetadata.bind(extract);
