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
});

export const getItemMetadata = vi.fn().mockResolvedValue({
  timestamp: MOCK_VERSION,
  length: 100,
  hash: "contenthash",
  ...MOCK_METADATA,
});

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
  ): Promise<{ version: string | null; versionName: string; content: string }> {
    return getItemContent(env, slug, version);
  }

  async getItemMetadata(
    env: StorageEnv,
    slug: string,
  ): Promise<VersionMetadata> {
    return getItemMetadata(env, slug);
  }
}

// Export singleton instance
export const storage = new Storage();
