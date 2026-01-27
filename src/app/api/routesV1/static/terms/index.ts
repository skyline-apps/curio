import { EnvBindings } from "@app/api/utils/env";
import {
  termsOfServiceData,
  TermsSection,
  TermsSubsection,
} from "@app/utils/content/terms";
import { getStaticPageHtml, renderMarkdown } from "api/routesV1/static/utils";
import { Hono } from "hono";

const staticTermsRouter = new Hono<EnvBindings>();

// Helper function to generate HTML sections from shared data
const generateHtmlSections = (): string => {
  const { sections } = termsOfServiceData;

  const renderSection = (section: TermsSection): string => {
    let html = `<div class="section"><h2>${section.title}</h2>`;

    if (section.content) {
      section.content.forEach((item: string) => {
        html += `<p>${renderMarkdown(item)}</p>`;
      });
    }

    if (section.items) {
      html += "<ul>";
      section.items.forEach((item: string) => {
        html += `<li>${renderMarkdown(item)}</li>`;
      });
      html += "</ul>";
    }

    if (section.subsections) {
      section.subsections.forEach((subsection: TermsSubsection) => {
        html += `<h3>${subsection.title}</h3>`;
        if (subsection.content) {
          if (Array.isArray(subsection.content)) {
            subsection.content.forEach((item: string) => {
              html += `<p>${renderMarkdown(item)}</p>`;
            });
          } else {
            html += `<p>${renderMarkdown(subsection.content)}</p>`;
          }
        }
        if (subsection.items) {
          html += "<ul>";
          subsection.items.forEach((item: string) => {
            html += `<li>${renderMarkdown(item)}</li>`;
          });
          html += "</ul>";
        }
        if (subsection.outro) {
          html += `<p>${renderMarkdown(subsection.outro)}</p>`;
        }
      });
    }

    if (section.outro) {
      html += `<p>${renderMarkdown(section.outro)}</p>`;
    }

    if (section.contact) {
      section.contact.forEach((item: string) => {
        html += `<p>${renderMarkdown(item)}</p>`;
      });
    }

    html += "</div>";
    return html;
  };

  return sections.map((section) => renderSection(section)).join("");
};

// eslint-disable-next-line @local/eslint-local-rules/api-validation,@local/eslint-local-rules/api-middleware,@local/eslint-local-rules/response-parse
staticTermsRouter.get("/", async (c) => {
  const bodyContent = `<h1>${termsOfServiceData.title}</h1>
    <p class="last-updated">Last updated: ${termsOfServiceData.lastUpdated}</p>
    ${generateHtmlSections()}`;

  return c.html(getStaticPageHtml(termsOfServiceData.title, bodyContent));
});

export { staticTermsRouter };
