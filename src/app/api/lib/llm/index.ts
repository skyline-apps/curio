import { Gateway } from "@adaline/gateway";
import { Google } from "@adaline/google";
import { Config } from "@adaline/types";

import { LLMError } from "./types";

const MODEL = "gemini-2.5-flash-preview-04-17";

export type LLMEnv = {
  GEMINI_API_KEY: string;
};

const defaultConfig = Config().parse({
  temperature: 0.4,
  maxTokens: 1024,
});

export async function summarizeItem(
  env: LLMEnv,
  articleText: string,
): Promise<string> {
  try {
    const gateway = new Gateway();
    const google = new Google();
    const model = google.chatModel({
      modelName: MODEL,
      apiKey: env.GEMINI_API_KEY,
    });
    const messages: {
      role: "system" | "user";
      content: { modality: "text"; value: string }[];
    }[] = [
      {
        role: "system",
        content: [
          {
            modality: "text",
            value: `You are a helpful assistant. Summarize the following article as a clear, concise summary in Markdown format that can be read in 1-2 minutes. Preserve the article's original section headers (if any) and capture all key points. Do not omit important context or nuance.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            modality: "text",
            value: articleText,
          },
        ],
      },
    ];
    const response = await gateway.completeChat({
      model,
      config: defaultConfig,
      messages,
      tools: [],
    });
    const assistantMsg = response.response.messages.find(
      (m: { role: string }) => m.role === "assistant",
    ) as { content: { modality: string; value: string }[] } | undefined;
    const summary = assistantMsg?.content.find(
      (c: { modality: string }) => c.modality === "text",
    )?.value;
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
    const { Gateway } = await import("@adaline/gateway");
    const { Google } = await import("@adaline/google");
    const gateway = new Gateway();
    const google = new Google();
    const model = google.chatModel({
      modelName: MODEL,
      apiKey: env.GEMINI_API_KEY,
    });
    const messages: {
      role: "system" | "user";
      content: { modality: "text"; value: string }[];
    }[] = [
      {
        role: "system",
        content: [
          {
            modality: "text",
            value: `You are a helpful assistant. Explain the following highlighted text snippet in the context of the full article provided. If the highlight is a name, describe who or what it refers to using the article. If it is a confusing sentence or paragraph, clarify its meaning and intent using the surrounding context. Be clear, accurate, and concise, and provide your answer in more than 2-3 sentences.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            modality: "text",
            value: `<full_article>\n${articleText}\n</full_article>\n\n<highlight_snippet>\n${snippet}\n</highlight_snippet>`,
          },
        ],
      },
    ];
    const response = await gateway.completeChat({
      model,
      config: defaultConfig,
      messages,
      tools: [],
    });
    const assistantMsg = response.response.messages.find(
      (m: { role: string }) => m.role === "assistant",
    ) as { content: { modality: string; value: string }[] } | undefined;
    const explanation = assistantMsg?.content.find(
      (c: { modality: string }) => c.modality === "text",
    )?.value;
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
