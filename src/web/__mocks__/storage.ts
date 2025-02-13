import { jest } from "@jest/globals";

import { UploadStatus } from "@/app/api/v1/items/content/validation";

import { MOCK_METADATA } from "./extract";

export const MOCK_VERSION = "2024-10-20T12:00:00.000Z";

export class Storage {
  async uploadItemContent(
    _slug: string,
    _content: string,
  ): Promise<Exclude<UploadStatus, UploadStatus.ERROR>> {
    return UploadStatus.UPDATED_MAIN;
  }

  async getItemContent(
    _slug: string,
    _version: string | null,
  ): Promise<{ version: string | null; content: string }> {
    return {
      version: null,
      content: "",
    };
  }

  async getItemMetadata(_slug: string): Promise<VersionMetadata> {
    return {
      timestamp: "2024-10-20T12:00:00.000Z",
      length: 100,
      hash: "contenthash",
      ...MOCK_METADATA,
    };
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
  .mockImplementation(async () => ({
    version: null,
    content: "test content",
  }));
export const getItemMetadata = jest
  .spyOn(storage, "getItemMetadata")
  .mockImplementation(async () => {
    return {
      timestamp: MOCK_VERSION,
      length: 100,
      hash: "contenthash",
      ...MOCK_METADATA,
    };
  });
