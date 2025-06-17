export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMError";
  }
}

// Gemini API response types for generateContent
export type GeminiContentPart = {
  text: string;
};

export type GeminiContent = {
  parts: GeminiContentPart[];
};

export type GeminiCandidate = {
  content: GeminiContent;
  // Other fields omitted for brevity
};

export type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
  // Other fields omitted for brevity
};
