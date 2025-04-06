import { MOCK_METADATA } from "@api/lib/extract/__mocks__/index";
import { ExtractedMetadata } from "@api/lib/extract/types";
import { type VersionMetadata } from "@api/lib/storage/types";
import { EnvContext } from "@api/utils/env";
import { UploadStatus } from "@shared/types";
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
    c: EnvContext,
    slug: string,
    content: string,
    metadata: ExtractedMetadata,
  ): Promise<{
    versionName: string;
    status: Exclude<UploadStatus, UploadStatus.ERROR>;
  }> {
    return uploadItemContent(c, slug, content, metadata);
  }

  async getItemContent(
    c: EnvContext,
    slug: string,
    version: string | null,
  ): Promise<{ version: string | null; versionName: string; content: string }> {
    return getItemContent(c, slug, version);
  }

  async getItemMetadata(c: EnvContext, slug: string): Promise<VersionMetadata> {
    return getItemMetadata(c, slug);
  }
}

// Export singleton instance
export const storage = new Storage();
