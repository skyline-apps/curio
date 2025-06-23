import ky from "ky";

import { GeminiGenerateContentResponse, LLMError } from "./types";

const MODEL = "gemini-2.5-flash-preview-04-17";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  MODEL +
  ":generateContent";

export type LLMEnv = {
  GEMINI_API_KEY: string;
};

const defaultConfig = {
  temperature: 0.4,
  maxOutputTokens: 1024,
};

export async function summarizeItem(
  env: LLMEnv,
  articleText: string,
): Promise<string> {
  try {
    const systemPrompt = `You are a helpful assistant. Summarize the following article as a clear, concise summary in Markdown format that can be read in 1-2 minutes. Preserve the article's original section headers (if any) and capture all key points. Do not omit important context or nuance.`;
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${articleText}` }],
        },
      ],
      generationConfig: defaultConfig,
    };
    const response = await ky
      .post(GEMINI_API_URL, {
        searchParams: { key: env.GEMINI_API_KEY },
        json: body,
        retry: { limit: 3 },
      })
      .json<GeminiGenerateContentResponse>();
    const summary = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof summary !== "string") {
      throw new LLMError("No summary returned by LLM");
    }
    return summary;
  } catch (err) {
    if (err instanceof Error) {
      throw new LLMError(`LLM request failed: ${err.message}`);
    }
    throw new LLMError(`Unknown LLM error: ${err}`);
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
  try {
    const systemPrompt = `You are a helpful assistant. Explain the following highlighted text snippet in the context of the provided article excerpt. If the highlight is a name, describe who or what it refers to using the context. If it is a confusing sentence or paragraph, clarify its meaning and intent using the surrounding context. Be clear, accurate, and concise, and provide your answer in more than 2-3 sentences.`;
    const contextExcerpt = extractContext(snippet, articleText);
    const userText = `<article_excerpt>\n${contextExcerpt}\n</article_excerpt>\n\n<highlight_snippet>\n${snippet}\n</highlight_snippet>`;
    const body = {
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userText}` }] },
      ],
      generationConfig: defaultConfig,
    };
    const response = await ky
      .post(GEMINI_API_URL, {
        searchParams: { key: env.GEMINI_API_KEY },
        json: body,
        retry: { limit: 3 },
      })
      .json<GeminiGenerateContentResponse>();
    const explanation = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof explanation !== "string") {
      throw new LLMError("No explanation returned by LLM");
    }
    return explanation;
  } catch (err) {
    if (err instanceof Error) {
      throw new LLMError(`LLM request failed: ${err.message}`);
    }
    throw new LLMError(`Unknown LLM error: ${err}`);
  }
}
