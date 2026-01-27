export const renderInlineMarkdown = (text: string): string => {
  let html = text;

  // Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

  // Links
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank">$1</a>',
  );

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic (simple)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline Code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  return html;
};

export const renderMarkdown = (markdown: string): string => {
  let html = markdown;

  // Remove table syntax (headers, alignment, pipes) so images render inline
  html = html.replace(/\| :---: \| :---: \|/g, "");
  html = html.replace(/\| \| \|/g, "");
  html = html.replace(/\|/g, "");

  // Code blocks
  html = html.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_, _lang, code) => `<pre><code>${code.trim()}</code></pre>`,
  );

  // Headers
  html = html.replace(/^###### (.*$)/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
  html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Process inline elements (Bold, Italic, Links, Images, Inline Code)
  // We do this AFTER headers so headers don't get messed up, but BEFORE lists/paragraphs
  html = renderInlineMarkdown(html);

  // Lists (simple unordered) and Paragraphs
  const lines = html.split("\n");
  let inList = false;
  let output = "";

  lines.forEach((line) => {
    // If it's a list item
    if (line.trim().startsWith("- ")) {
      if (!inList) {
        output += "<ul>\n";
        inList = true;
      }
      // Process the content of the list item using inline renderer?
      // Actually we already ran inline renderer on the whole `html` string.
      // So `line` already has <strong> etc.
      // But we need to strip the `- `
      output += `<li>${line.trim().substring(2)}</li>`;
    } else {
      if (inList) {
        output += "</ul>\n";
        inList = false;
      }

      const trimmed = line.trim();
      // Paragraphs: avoid wrapping block tags we identified or created
      if (trimmed.length > 0) {
        if (
          !trimmed.startsWith("<h") &&
          !trimmed.startsWith("<pre") &&
          !trimmed.startsWith("<img") && // Images might be wrapped in p? Usually yes.
          !trimmed.startsWith("<ul") &&
          !trimmed.startsWith("<li") &&
          !trimmed.startsWith("<div")
        ) {
          // If it's an image tag alone, maybe we don't want p?
          // But usually image inline is fine.
          // The previous logic checked startswith <img.
          output += `<p>${line}</p>`;
        } else {
          output += line;
        }
      }
    }
  });
  if (inList) output += "</ul>\n";

  return output;
};
