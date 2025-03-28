import { MOCK_METADATA } from "@web/lib/extract/__mocks__/index";
import { ExtractedMetadata } from "@web/lib/extract/types";
import { UploadStatus } from "@web/lib/storage/types";
import { type VersionMetadata } from "@web/lib/storage/types";
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
    slug: string,
    content: string,
    metadata: ExtractedMetadata,
  ): Promise<{
    versionName: string;
    status: Exclude<UploadStatus, UploadStatus.ERROR>;
  }> {
    return uploadItemContent(slug, content, metadata);
  }

  async getItemContent(
    slug: string,
    version: string | null,
  ): Promise<{ version: string | null; versionName: string; content: string }> {
    return getItemContent(slug, version);
  }

  async getItemMetadata(slug: string): Promise<VersionMetadata> {
    return getItemMetadata(slug);
  }
}

// Export singleton instance
export const storage = new Storage();
