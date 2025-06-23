import { GoogleGenAI } from "@google/genai";

import { LLMError } from "./types";

const MODEL = "gemini-2.5-flash-preview-04-17";

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
  // Initialize GoogleGenAI with the provided API key
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  // Helper to chunk by paragraphs with a max character limit
  function chunkArticle(text: string, maxLines: number = 50): string[] {
    const lines = text.split(/\r?\n/);
    const chunks: string[] = [];
    for (let i = 0; i < lines.length; i += maxLines) {
      const chunkLines = lines.slice(i, i + maxLines);
      const chunk = chunkLines.join("\n");
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    return chunks;
  }

  async function summarizeChunk(
    chunk: string,
    retries = 3,
    backoffMs = 300,
  ): Promise<string> {
    const systemPrompt = `You are a helpful reading assistant. Summarize the following article chunk as a clear, concise summary according to the following guidelines:\n\n- Return your summary in Markdown format.\n- Preserve section headers (if any) and capture all key points.\n- Do not omit important context or nuance.`;
    const prompt = `${systemPrompt}\n\n${chunk}`;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model: MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: defaultConfig,
        });
        const summary = (result && result.text) ?? "";
        if (typeof summary !== "string" || !summary.trim()) {
          throw new LLMError("No summary returned by LLM for chunk");
        }
        return summary;
      } catch (err) {
        if (attempt < retries - 1) {
          // Exponential backoff
          await new Promise((res) =>
            setTimeout(res, backoffMs * Math.pow(2, attempt)),
          );
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

  const chunks = chunkArticle(articleText);
  const chunkSummaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    try {
      const summary = await summarizeChunk(chunks[i]);
      chunkSummaries.push(summary);
    } catch (err) {
      // Optionally: add logging or partial summary recovery here
      throw new LLMError(
        `Failed to summarize chunk ${i + 1}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // If only one chunk, return its summary directly
  if (chunkSummaries.length === 1) {
    return chunkSummaries[0];
  }

  // Hierarchical summarization: recursively combine chunk summaries in batches
  async function combineSummaries(
    summaries: string[],
    batchSize = 3,
    retries = 3,
    backoffMs = 300,
  ): Promise<string> {
    if (summaries.length === 1) return summaries[0];
    const batches: string[][] = [];
    for (let i = 0; i < summaries.length; i += batchSize) {
      batches.push(summaries.slice(i, i + batchSize));
    }
    const batchSummaries: string[] = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const systemPrompt = `You are a helpful assistant. Given the following summaries of an article, produce a single, clear, concise summary in Markdown format that can be read in 1-2 minutes. Preserve the article's original section headers (if any) and capture all key points. Do not omit important context or nuance.`;
      const prompt = batch.map((s, j) => `Part ${j + 1}:\n${s}`).join("\n\n");
      let lastErr;
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const result = await ai.models.generateContent({
            model: MODEL,
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
              },
            ],
            config: defaultConfig,
          });
          const summary = (result && result.text) ?? "";
          if (typeof summary !== "string" || !summary.trim()) {
            throw new LLMError(
              "No summary returned by LLM for combined summary",
            );
          }
          batchSummaries.push(summary);
          lastErr = undefined;
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < retries - 1) {
            await new Promise((res) =>
              setTimeout(res, backoffMs * Math.pow(2, attempt)),
            );
          }
        }
      }
      if (lastErr) {
        throw new LLMError(
          `LLM request failed for combined summary batch ${i + 1}: ${lastErr instanceof Error ? lastErr.message : lastErr}`,
        );
      }
    }
    // Recursively combine until 1 summary remains
    return combineSummaries(batchSummaries, batchSize, retries, backoffMs);
  }

  return combineSummaries(chunkSummaries);
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
      config: defaultConfig,
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
