import { GoogleGenAI } from "@google/genai";

import { LLMError } from "./types";

const MODEL = "gemini-2.5-flash";

export type LLMEnv = {
  GEMINI_API_KEY: string;
};

function splitBySections(text: string): { header: string; content: string }[] {
  const lines = text.split(/\r?\n/);
  const sections: { header: string; content: string }[] = [];
  let currentHeader = "";
  let currentContent: string[] = [];
  const headerRegex = /^(#{1,6})\s+(.*)$/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headerRegex);
    if (match) {
      if (currentHeader || currentContent.length > 0) {
        // Push previous section
        sections.push({
          header: currentHeader,
          content: currentContent.join("\n").trim(),
        });
      }
      currentHeader = line.trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  // Push the last section
  if (currentHeader || currentContent.length > 0) {
    sections.push({
      header: currentHeader,
      content: currentContent.join("\n").trim(),
    });
  }
  // If the first section has no header (i.e., content before the first header), ensure its header is empty string
  return sections.filter((sec) => sec.header || sec.content);
}

function parseRetryDelay(error: unknown): number | null {
  if (typeof error === "object" && error !== null) {
    const message =
      (error as { message?: string }).message || JSON.stringify(error);
    const match = message.match(/"retryDelay":"(\d+(\.\d+)?)s"/);
    if (match) {
      return parseFloat(match[1]) * 1000;
    }
  }
  return null;
}

async function summarizeChunk(
  ai: GoogleGenAI,
  chunk: string,
  retries = 3,
  backoffMs = 300,
): Promise<string> {
  const systemPrompt = `You are a helpful reading assistant. Summarize the following article section as a clear, concise summary according to the following guidelines:\n\n- Return your summary in Markdown format.\n- Capture all key points, and call out any memorable quotes in Markdown blockquotes.\n- Preserve the original writing style (journalistic, academic, creative, etc.), tone (informative, sensational, reflective, humorous, etc.)\n- Preserve the original voice (first-person, second-person, third-person, etc.).\n- Do not preface your summary with any additional text.\n- Be concise and keep the summary to 2-6 sentences.`;
  const prompt = `${systemPrompt}\n\n${chunk}`;

  let attempts = 0;
  while (attempts < retries) {
    try {
      const result = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          maxOutputTokens: 1024 * 10,
        },
      });
      const summary = (result && result.text) ?? "";
      if (typeof summary !== "string" || !summary.trim()) {
        throw new LLMError("No summary returned by LLM for chunk");
      }
      return summary;
    } catch (err) {
      const retryDelay = parseRetryDelay(err);
      if (retryDelay) {
        // If we get a 429 with a specific retry delay, wait and retry without incrementing attempts
        // (or incrementing slower) to respect the server's request.
        // However, to avoid infinite loops, we still need a break condition.
        // Let's treat it as a "free" retry but with a max limit of, say, 3 "quota" retries effectively.
        // For simplicity, we just wait and retry, but we'll increment attempt only if we don't have a retryDelay
        // OR we can just wait the delay and count it as an attempt.
        // Better: Wait the delay + buffer, and count it as an attempt (or not?).
        // If we count it, we might exhaust retries too fast if the delay is long.
        // If the delay is 49s, and we have 3 retries, we wait 49s, then retry.
        // Let's wait the delay and NOT count it as a standard attempt, but have a separate safety counter.
        await new Promise((res) => setTimeout(res, retryDelay + 1000));
        continue;
      }

      if (attempts < retries - 1) {
        // Exponential backoff for other errors
        await new Promise((res) =>
          setTimeout(res, backoffMs * Math.pow(2, attempts)),
        );
        attempts++;
      } else {
        // If we've exhausted retries, try to split the chunk into smaller sub-chunks
        const lines = chunk.split(/\r?\n/);
        if (lines.length > 12) {
          // Arbitrary threshold to avoid infinite recursion
          const subChunkSize = 10;
          const subChunks: string[] = [];
          for (let i = 0; i < lines.length; i += subChunkSize) {
            const sub = lines.slice(i, i + subChunkSize).join("\n");
            if (sub.trim()) subChunks.push(sub.trim());
          }
          const subSummaries: string[] = [];
          for (let j = 0; j < subChunks.length; j++) {
            try {
              const subSummary = await summarizeChunk(
                ai,
                subChunks[j],
                retries,
                backoffMs,
              );
              subSummaries.push(subSummary);
            } catch (subErr) {
              throw new LLMError(
                `Failed to summarize sub-chunk ${j + 1} of fallback for chunk: ${subErr instanceof Error ? subErr.message : subErr}`,
              );
            }
          }
          // Combine sub-summaries as the summary for this chunk
          return subSummaries.join("\n\n");
        }
        // If chunk is already very small, throw error
        throw new LLMError(
          `LLM chunk request failed after retries: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
  throw new LLMError("Unknown error in summarizeChunk retry loop");
}

export async function summarizeItem(
  env: LLMEnv,
  articleText: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const sections = splitBySections(articleText);
  const sectionSummaries: string[] = [];
  for (let i = 0; i < sections.length; i++) {
    const { header, content } = sections[i];
    if (content.trim()) {
      try {
        const sectionText = header ? `${header}\n${content}` : content;
        const summary = await summarizeChunk(ai, sectionText);
        if (header) {
          sectionSummaries.push(`${header}\n${summary.trim()}`);
        } else {
          sectionSummaries.push(summary.trim());
        }
      } catch (err) {
        throw new LLMError(
          `Failed to summarize section ${header || i + 1}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
  return sectionSummaries.join("\n\n");
}

export async function* summarizeItemStream(
  env: LLMEnv,
  articleText: string,
): AsyncGenerator<string, void, unknown> {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const sections = splitBySections(articleText);
  for (let i = 0; i < sections.length; i++) {
    const { header, content } = sections[i];
    if (content.trim()) {
      try {
        const sectionText = header ? `${header}\n${content}` : content;
        const summary = await summarizeChunk(ai, sectionText);
        if (header) {
          yield `${header}\n${summary.trim()}\n\n`;
        } else {
          yield `${summary.trim()}\n\n`;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new LLMError(
          `Error summarizing section ${header || i + 1}: ${msg}\n\n`,
        );
      }
    }
  }
}

function extractContext(snippet: string, articleText: string): string {
  // Split article into lines and paragraphs
  const lines = articleText.split(/\r?\n/);
  const paragraphs = articleText.split(/\n\s*\n/);

  // Find the snippet in the article
  let snippetLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(snippet)) {
      snippetLineIdx = i;
      break;
    }
  }

  // Extract 5 lines before and after
  let contextLines: string[] = [];
  if (snippetLineIdx !== -1) {
    const start = Math.max(0, snippetLineIdx - 5);
    const end = Math.min(lines.length, snippetLineIdx + 6);
    contextLines = lines.slice(start, end);
  } else {
    // Fallback: just use the snippet itself
    contextLines = [snippet];
  }

  // Extract proper nouns from the snippet (simple heuristic: capitalized words not at start of sentence)
  const properNouns = Array.from(
    new Set(
      Array.from(
        snippet.matchAll(/\b(?![A-Z][a-z]{0,2}\b)([A-Z][a-zA-Z0-9]+)\b/g),
      ).map((match) => match[1]),
    ),
  );

  // Find paragraphs containing any proper noun
  const nounParagraphs =
    properNouns.length > 0
      ? paragraphs.filter((p) => properNouns.some((noun) => p.includes(noun)))
      : [];

  // Avoid duplicate paragraphs if contextLines already include them
  const context = [
    contextLines.join("\n"),
    ...nounParagraphs.filter((p) => !contextLines.join("\n").includes(p)),
  ].join("\n\n");

  return context;
}

export async function explainInContext(
  env: LLMEnv,
  snippet: string,
  articleText: string,
): Promise<string> {
  // Use the same ai instance as summarizeItem
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  try {
    const systemPrompt = `You are a helpful reading assistant. Given excerpts from an article and a highlighted snippet from that article, provide a concise and informative explanation of the snippet.\n\n- If the snippet contains names, places, or terms, briefly define or describe them using context from the article.\n- If the snippet includes confusing or ambiguous language, clarify its meaning and intent based on the surrounding context.\n- Format your response using plain text only, no Markdown.\n- Keep your explanation clear, accurate, and no longer than 2-3 sentences.`;
    const contextExcerpt = extractContext(snippet, articleText);
    const userText = `<article_excerpt>\n${contextExcerpt}\n</article_excerpt>\n\n<highlight_snippet>\n${snippet}\n</highlight_snippet>`;
    const prompt = `${systemPrompt}\n\n${userText}`;
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });
    const explanation = (result && result.text) ?? "";
    if (typeof explanation !== "string" || !explanation.trim()) {
      throw new LLMError("No valid explanation returned. Please try again.");
    }
    return explanation;
  } catch (err) {
    if (err instanceof Error) {
      throw new LLMError(`LLM request failed: ${err.message}`);
    }
    throw new LLMError(`Unknown LLM error: ${err}`);
  }
}
