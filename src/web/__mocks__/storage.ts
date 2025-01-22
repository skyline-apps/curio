import { jest } from "@jest/globals";

import { UploadStatus } from "@/app/api/v1/items/[slug]/content/validation";

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export class Storage {
  async uploadItemContent(
    _slug: string,
    _content: string,
  ): Promise<Exclude<UploadStatus, UploadStatus.ERROR>> {
    return UploadStatus.UPDATED_MAIN;
  }

  async getItemContent(_slug: string): Promise<string> {
    return "";
  }

  async listItemVersions(_slug: string): Promise<VersionMetadata[]> {
    return [];
  }
}

interface VersionMetadata {
  timestamp: string;
  length: number;
  hash: string;
}

// Export singleton instance
export const storage = new Storage();

// Create spies for each method
export const uploadItemContent = jest
  .spyOn(storage, "uploadItemContent")
  .mockImplementation(async () => UploadStatus.UPDATED_MAIN);
export const getItemContent = jest
  .spyOn(storage, "getItemContent")
  .mockImplementation(async () => "");
export const listItemVersions = jest
  .spyOn(storage, "listItemVersions")
  .mockImplementation(async () => []);

// Set default mock values
getItemContent.mockResolvedValue("test content");
uploadItemContent.mockResolvedValue(UploadStatus.UPDATED_MAIN);
