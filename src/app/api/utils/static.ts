import { renderMarkdown } from "@app/utils/markdown";

export { renderMarkdown };

export const getStaticPageHtml = (
  title: string,
  bodyContent: string,
): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Curio</title>
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
        h4 {
            font-size: 0.875rem;
            font-weight: 600;
            margin-top: 16px;
            margin-bottom: 8px;
        }
        h5 {
            font-size: 0.875rem;
            font-weight: 500;
            margin-top: 16px;
            margin-bottom: 8px;
        }
        h6 {
            font-size: 0.875rem;
            font-weight: 500;
            margin-top: 16px;
            margin-bottom: 8px;
            color: #666;
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
        img {
            max-width: 100%;
            max-height: 300px;
            height: auto;
            margin: 1rem 0;
            border-radius: 0.5rem;
        }
        blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1rem;
            margin-left: 0;
            font-style: italic;
        }
        code {
            font-family: monospace;
            background: #f3f4f6;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
        }
        pre {
            background: #1f2937;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
        }
        pre code {
            background: transparent;
            padding: 0;
            color: white;
        }
    </style>
</head>
<body>
    <div style="text-align: center; margin-bottom: 2rem;">
        <a href="/">
            <img src="https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/assets/curio_dark.svg" alt="Curio" style="height: 40px; width: auto;" />
        </a>
    </div>
    ${bodyContent}
</body>
</html>`;
};
