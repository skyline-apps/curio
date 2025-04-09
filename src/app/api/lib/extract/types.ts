import { TextDirection } from "@app/schemas/db";

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

export interface ExtractedMetadata {
  author: string | null;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  favicon: string | null;
  publishedAt: Date | null;
  textDirection: TextDirection;
  textLanguage: string | null;
}
