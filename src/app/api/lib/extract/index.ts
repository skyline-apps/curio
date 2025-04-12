import { TextDirection } from "@app/schemas/db";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { NodeHtmlMarkdown, TranslatorConfigObject } from "node-html-markdown";

import { ExtractedMetadata, ExtractError } from "./types";

const customTranslators: TranslatorConfigObject = {
  "h1,h2,h3,h4,h5,h6": ({ node }) => {
    const headingLevel = parseInt(node.tagName.substring(1), 10);
    const prefix = "#".repeat(headingLevel) + " ";
    return {
      prefix,
      recurse: true,
      postprocess: ({ content }) => {
        // Remove leading and trailing whitespace, and replace multiple spaces with a single space
        return content.trim().replace(/\s+/g, " ");
      },
    };
  },
};

const htmlToMarkdown = new NodeHtmlMarkdown(
  {
    bulletMarker: "-",
  },
  customTranslators,
);

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
      // Ensure we have a full HTML structure for linkedom/Readability
      const fullHtml = html.trim().match(/<html/i)
        ? html
        : `<!DOCTYPE html><html><body>${html}</body></html>`;

      // Pass the potentially wrapped HTML to parseHTML
      const { document } = parseHTML(fullHtml, { location: new URL(url) });

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

      const content = htmlToMarkdown.translate(article.content);
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
