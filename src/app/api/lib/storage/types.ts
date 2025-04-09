import { ExtractedMetadata } from "@app/api/lib/extract/types";

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export interface VersionMetadata extends ExtractedMetadata {
  timestamp: string;
  length: number;
  hash: string;
}
