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

export async function explainInContext(
  env: LLMEnv,
  snippet: string,
  articleText: string,
): Promise<string> {
  try {
    const systemPrompt = `You are a helpful assistant. Explain the following highlighted text snippet in the context of the full article provided. If the highlight is a name, describe who or what it refers to using the article. If it is a confusing sentence or paragraph, clarify its meaning and intent using the surrounding context. Be clear, accurate, and concise, and provide your answer in more than 2-3 sentences.`;
    const userText = `<full_article>\n${articleText}\n</full_article>\n\n<highlight_snippet>\n${snippet}\n</highlight_snippet>`;
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
