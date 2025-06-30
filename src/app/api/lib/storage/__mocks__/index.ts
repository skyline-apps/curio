import { MOCK_METADATA } from "@app/api/lib/extract/__mocks__/index";
import { ExtractedMetadata } from "@app/api/lib/extract/types";
import { StorageEnv } from "@app/api/lib/storage";
import { type VersionMetadata } from "@app/api/lib/storage/types";
import { UploadStatus } from "@app/schemas/types";
import { vi } from "vitest";

export const MOCK_VERSION = "2024-10-20T12:00:00.000Z";

// Create mock functions
export const uploadItemContent = vi.fn().mockResolvedValue({
  versionName: MOCK_VERSION,
  status: UploadStatus.UPDATED_MAIN,
});

export const getItemContent = vi.fn().mockResolvedValue({
  version: null,
  versionName: MOCK_VERSION,
  content: "test content",
  summary: null,
});

export const getItemMetadata = vi.fn().mockResolvedValue({
  timestamp: MOCK_VERSION,
  length: 100,
  hash: "contenthash",
  ...MOCK_METADATA,
});

export const uploadItemSummary = vi.fn().mockResolvedValue(undefined);

export const uploadImportFile = vi.fn().mockResolvedValue({});

export const readImportFile = vi.fn().mockResolvedValue(new Blob());

// Export class with mock functions
export class Storage {
  async uploadItemContent(
    env: StorageEnv,
    slug: string,
    content: string,
    metadata: ExtractedMetadata,
  ): Promise<{
    versionName: string;
    status: Exclude<UploadStatus, UploadStatus.ERROR>;
  }> {
    return uploadItemContent(env, slug, content, metadata);
  }

  async getItemContent(
    env: StorageEnv,
    slug: string,
    version: string | null,
  ): Promise<{
    version: string | null;
    versionName: string;
    content: string;
    summary: string | null;
  }> {
    return getItemContent(env, slug, version);
  }

  async getItemMetadata(
    env: StorageEnv,
    slug: string,
  ): Promise<VersionMetadata> {
    return getItemMetadata(env, slug);
  }

  async uploadItemSummary(
    env: StorageEnv,
    slug: string,
    version: string | null,
    summary: string,
  ): Promise<void> {
    return uploadItemSummary(env, slug, version, summary);
  }

  async uploadImportFile(
    env: StorageEnv,
    objectKey: string,
    file: File,
  ): Promise<void> {
    return uploadImportFile(env, objectKey, file);
  }

  async readImportFile(env: StorageEnv, objectKey: string): Promise<Blob> {
    return readImportFile(env, objectKey);
  }
}

// Export singleton instance
export const storage = new Storage();
