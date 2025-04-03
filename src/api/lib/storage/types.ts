import { ExtractedMetadata } from "@api/lib/extract/types";

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

export enum UploadStatus {
  UPDATED_MAIN = "UPDATED_MAIN",
  STORED_VERSION = "STORED_VERSION",
  SKIPPED = "SKIPPED",
  ERROR = "ERROR",
}
