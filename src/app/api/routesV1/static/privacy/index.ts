import { EnvBindings } from "@app/api/utils/env";
import {
  privacyPolicyData,
  renderMarkdownText,
} from "@app/utils/content/privacy";
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
          html += `<p>${renderMarkdownText(item)}</p>`;
        });
      } else {
        html += `<p>${renderMarkdownText(section.content)}</p>`;
      }
    }

    if (section.intro) {
      html += `<p>${renderMarkdownText(section.intro)}</p>`;
    }

    if (section.items) {
      html += "<ul>";
      section.items.forEach((item: string) => {
        html += `<li>${renderMarkdownText(item)}</li>`;
      });
      html += "</ul>";
    }

    if (section.subsections) {
      Object.values(section.subsections).forEach(
        (subsection: PrivacyPolicySubsection) => {
          html += `<h3>${subsection.title}</h3>`;
          if (subsection.content) {
            html += `<p>${renderMarkdownText(subsection.content)}</p>`;
          }
          if (subsection.items) {
            html += "<ul>";
            subsection.items.forEach((item: string) => {
              html += `<li>${renderMarkdownText(item)}</li>`;
            });
            html += "</ul>";
          }
          if (subsection.outro) {
            html += `<p>${renderMarkdownText(subsection.outro)}</p>`;
          }
        },
      );
    }

    if (section.outro) {
      html += `<p>${renderMarkdownText(section.outro)}</p>`;
    }

    if (section.contact) {
      html += `<p>${renderMarkdownText(section.contact)}</p>`;
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
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${privacyPolicyData.title} - Curio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 500;
            text-align: center;
            margin-bottom: 8px;
        }
        h2 {
            font-size: 1rem;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 8px;
        }
        h3 {
            font-size: 0.9rem;
            font-weight: 500;
            margin-top: 16px;
            margin-bottom: 8px;
        }
        p {
            font-size: 0.875rem;
            margin-bottom: 8px;
        }
        ul {
            font-size: 0.875rem;
            margin-left: 24px;
            margin-bottom: 8px;
        }
        li {
            margin-bottom: 4px;
        }
        .last-updated {
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 32px;
        }
        a {
            color: #059669;
            text-decoration: none;
        }
        a:hover {
            color: #047857;
            text-decoration: underline;
        }
        .section {
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <h1>${privacyPolicyData.title}</h1>
    <p class="last-updated">Last updated: ${privacyPolicyData.lastUpdated}</p>

    ${generateHtmlSections()}
</body>
</html>`;

  return c.html(html);
});

export { staticPrivacyRouter };
