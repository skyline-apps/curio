import { jest } from "@jest/globals";

import { UploadStatus } from "@/app/api/v1/items/content/validation";
import { type VersionMetadata } from "@/lib/storage/types";

import { MOCK_METADATA } from "./extract";

export const MOCK_VERSION = "2024-10-20T12:00:00.000Z";

export class Storage {
  async uploadItemContent(
    _slug: string,
    _content: string,
  ): Promise<{
    versionName: string;
    status: Exclude<UploadStatus, UploadStatus.ERROR>;
  }> {
    return {
      versionName: MOCK_VERSION,
      status: UploadStatus.UPDATED_MAIN,
    };
  }

  async getItemContent(
    _slug: string,
    _version: string | null,
  ): Promise<{ version: string | null; versionName: string; content: string }> {
    return {
      version: null,
      versionName: MOCK_VERSION,
      content: "",
    };
  }

  async getItemMetadata(_slug: string): Promise<VersionMetadata> {
    return {
      timestamp: MOCK_VERSION,
      length: 100,
      hash: "contenthash",
      ...MOCK_METADATA,
    };
  }
}

// Export singleton instance
export const storage = new Storage();

// Create spies for each method
export const uploadItemContent = jest
  .spyOn(storage, "uploadItemContent")
  .mockImplementation(async () => ({
    versionName: MOCK_VERSION,
    status: UploadStatus.UPDATED_MAIN,
  }));
export const getItemContent = jest
  .spyOn(storage, "getItemContent")
  .mockImplementation(async () => ({
    version: null,
    versionName: MOCK_VERSION,
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
