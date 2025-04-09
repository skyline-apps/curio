import { TextDirection } from "@app/schemas/db";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService, { Node as TurndownNode } from "turndown";

import { ExtractedMetadata, ExtractError } from "./types";

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

  const node = parseHTML(html).document;
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
    return content;
  },
});

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

  async extractFromHtml(
    url: string,
    html: string,
  ): Promise<{ content: string; metadata: ExtractedMetadata }> {
    try {
      const { document } = parseHTML(html, { location: new URL(url) });

      const reader = new Readability(document, {
        // @ts-expect-error: https://github.com/mozilla/readability/issues/966
        linkDensityModifier: 0.1,
      });
      const article = reader.parse();
      if (!article || !article.content) {
        throw new ExtractError("Failed to extract content");
      }
      const favicon = this.createAbsoluteUrl(
        this.extractFavicon(document),
        url,
      );
      const thumbnail = this.getMetaContent(document, [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[property="og:image:url"]',
      ]);
      let textDirection = TextDirection.LTR;
      if (article.dir === "rtl") {
        textDirection = TextDirection.RTL;
      } else if (article.dir === "auto") {
        textDirection = TextDirection.AUTO;
      }
      const metadata = {
        title: article.title || null,
        description: article.excerpt || null,
        author: article.byline || null,
        publishedAt: article.publishedTime
          ? new Date(article.publishedTime)
          : null,
        textLanguage: article.lang || null,
        textDirection,
        thumbnail: thumbnail,
        favicon: favicon,
      };

      const content = turndown.turndown(article.content);
      if (metadata.textDirection !== TextDirection.LTR) {
        return {
          content: `<div dir="${article.dir}">\n\n${content}\n\n</div>`,
          metadata,
        };
      }
      return { content, metadata };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Readability constructor")) {
          throw new ExtractError("Issue extracting content");
        }
        throw error;
      }
      throw new Error(String(error));
    }
  }
}

export const extract = new Extract();

export const extractFromHtml = extract.extractFromHtml.bind(extract);
