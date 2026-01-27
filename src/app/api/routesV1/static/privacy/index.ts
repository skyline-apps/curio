import { EnvBindings } from "@app/api/utils/env";
import { privacyPolicyData } from "@app/utils/content/privacy";
import { getStaticPageHtml, renderMarkdown } from "api/routesV1/static/utils";
import { Hono } from "hono";

const staticPrivacyRouter = new Hono<EnvBindings>();

// Type definitions for privacy policy sections
interface PrivacyPolicySection {
  title: string;
  content?: string | string[];
  intro?: string;
  items?: string[];
  subsections?: Record<string, PrivacyPolicySubsection>;
  outro?: string;
  contact?: string;
}

interface PrivacyPolicySubsection {
  title: string;
  content?: string;
  items?: string[];
  outro?: string;
}

// Helper function to generate HTML sections from shared data
const generateHtmlSections = (): string => {
  const { sections } = privacyPolicyData;

  const renderSection = (section: PrivacyPolicySection): string => {
    let html = `<div class="section"><h2>${section.title}</h2>`;

    // Handle different section structures
    if (section.content) {
      if (Array.isArray(section.content)) {
        section.content.forEach((item: string) => {
          html += `<p>${renderMarkdown(item)}</p>`;
        });
      } else {
        html += `<p>${renderMarkdown(section.content)}</p>`;
      }
    }

    if (section.intro) {
      html += `<p>${renderMarkdown(section.intro)}</p>`;
    }

    if (section.items) {
      html += "<ul>";
      section.items.forEach((item: string) => {
        html += `<li>${renderMarkdown(item)}</li>`;
      });
      html += "</ul>";
    }

    if (section.subsections) {
      Object.values(section.subsections).forEach(
        (subsection: PrivacyPolicySubsection) => {
          html += `<h3>${subsection.title}</h3>`;
          if (subsection.content) {
            html += `<p>${renderMarkdown(subsection.content)}</p>`;
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
        },
      );
    }

    if (section.outro) {
      html += `<p>${renderMarkdown(section.outro)}</p>`;
    }

    if (section.contact) {
      html += `<p>${renderMarkdown(section.contact)}</p>`;
    }

    html += "</div>";
    return html;
  };

  return Object.entries(sections)
    .map(([_key, section]) => renderSection(section))
    .join("");
};

// eslint-disable-next-line @local/eslint-local-rules/api-validation,@local/eslint-local-rules/api-middleware,@local/eslint-local-rules/response-parse
staticPrivacyRouter.get("/", async (c) => {
  const bodyContent = `<h1>${privacyPolicyData.title}</h1>
    <p class="last-updated">Last updated: ${privacyPolicyData.lastUpdated}</p>
    ${generateHtmlSections()}`;

  return c.html(getStaticPageHtml(privacyPolicyData.title, bodyContent));
});

export { staticPrivacyRouter };
