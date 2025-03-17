import { TextDirection } from "@/db/schema";

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

export class MetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetadataError";
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
