import { TextDirection } from "@web/db/schema";
import config from "@web/lib/config.json";
import { ExtractedMetadata } from "@web/lib/extract/types";
import { StorageError, UploadStatus } from "@web/lib/storage/types";
import { createLogger } from "@web/utils/logger";
import { createClient } from "@web/utils/supabase/server";
import type { StorageClient } from "@web/utils/supabase/types";
import { createHash } from "crypto";

import { type VersionMetadata } from "./types";

const log = createLogger("lib/storage");
const DEFAULT_NAME = "default";
const ITEMS_BUCKET = config.storageItemsBucket;

export class Storage {
  private storage: StorageClient | null = null;
  private lastInitTime: number = 0;
  private readonly REFRESH_INTERVAL = 3600000; // 1 hour in milliseconds

  private async getStorageClient(): Promise<StorageClient> {
    const now = Date.now();
    if (!this.storage || now - this.lastInitTime > this.REFRESH_INTERVAL) {
      const supabase = await createClient(true);
      this.storage = supabase.storage;
      this.lastInitTime = now;

      try {
        // Verify we can access the bucket
        await this.storage.from(ITEMS_BUCKET).list();
      } catch (error) {
        log.error("Failed to verify storage access", { error });
        // Reset storage client to force re-initialization on next attempt
        this.storage = null;
        throw new StorageError("Failed to initialize storage client");
      }
    }
    return this.storage;
  }

  private computeContentHash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  async uploadItemContent(
    slug: string,
    content: string,
    metadata: ExtractedMetadata,
  ): Promise<{
    versionName: string;
    status: Exclude<UploadStatus, UploadStatus.ERROR>;
  }> {
    const storage = await this.getStorageClient();
    const timestamp = new Date().toISOString();
    const contentHash = this.computeContentHash(content);

    // Check if this exact content already exists
    const { data: existingVersions } = await storage
      .from(ITEMS_BUCKET)
      .list(`${slug}/versions`);

    if (existingVersions?.length) {
      for (const version of existingVersions) {
        try {
          const { data, error } = await storage
            .from(ITEMS_BUCKET)
            .info(`${slug}/versions/${version.name}`);
          if (error) {
            continue;
          }
          const existingMetadata = data.metadata;
          if (existingMetadata && existingMetadata.hash === contentHash) {
            log.info("Content already exists, skipping upload", {
              slug,
              hash: contentHash,
            });
            return {
              versionName: version.name,
              status: UploadStatus.SKIPPED,
            };
          }
        } catch (e) {
          log.error("Failed to parse version metadata", {
            error: e,
            version,
          });
        }
      }
    }
    let fileMetadata: VersionMetadata;
    try {
      fileMetadata = JSON.parse(
        JSON.stringify({
          timestamp,
          length: content.length,
          hash: contentHash,
          ...metadata,
        }),
      );
    } catch (e) {
      throw new StorageError("Failed to serialize version metadata");
    }

    // Check current main file content length
    let defaultMetadata: VersionMetadata | null = null;
    try {
      const { data } = await storage
        .from(ITEMS_BUCKET)
        .info(`${slug}/${DEFAULT_NAME}.md`);
      defaultMetadata = (data?.metadata as VersionMetadata) || null;
    } catch (error) {
      // Main file doesn't exist yet, or error reading it
      log.info("No existing content for ${slug} or error reading it:", error);
    }

    // This is either the first version or a longer version than current
    const versionPath = `${slug}/versions/${timestamp}.md`;

    // Upload as new version
    const { error: versionError } = await storage
      .from(ITEMS_BUCKET)
      .upload(versionPath, content, {
        contentType: "text/markdown",
        upsert: false,
        metadata: fileMetadata,
      });

    if (versionError) {
      log.error(`Error uploading version for item ${slug}:`, versionError);
      throw new StorageError("Failed to upload version");
    }

    if (defaultMetadata?.length && defaultMetadata.length >= content.length) {
      return {
        versionName: timestamp,
        status: UploadStatus.STORED_VERSION,
      };
    }

    // Update main file since this is longer
    const { error: mainError } = await storage
      .from(ITEMS_BUCKET)
      .upload(`${slug}/${DEFAULT_NAME}.md`, content, {
        contentType: "text/markdown",
        upsert: true,
        metadata: fileMetadata,
      });

    if (mainError) {
      log.error(`Error updating main file for item ${slug}:`, mainError);
      throw new StorageError("Failed to update main file");
    }

    return { versionName: timestamp, status: UploadStatus.UPDATED_MAIN };
  }

  async getItemContent(
    slug: string,
    version: string | null,
  ): Promise<{ version: string | null; versionName: string; content: string }> {
    const storage = await this.getStorageClient();
    const versionPath = version
      ? `${slug}/versions/${version}.md`
      : `${slug}/${DEFAULT_NAME}.md`;

    const { data: content, error } = await storage
      .from(ITEMS_BUCKET)
      .download(versionPath);
    const { data: metadata, error: metadataError } = await storage
      .from(ITEMS_BUCKET)
      .info(versionPath);

    if (error || metadataError || !metadata.metadata) {
      if (version) {
        return this.getItemContent(slug, null);
      } else {
        if (error) {
          log.error(`Error getting content for ${slug}:`, error);
        } else if (metadataError) {
          log.error(`Error getting metadata for ${slug}:`, metadataError);
        } else if (!metadata.metadata) {
          log.error(`Error getting metadata for ${slug}:`, "metadata is null");
        }
        throw new StorageError("Failed to download content");
      }
    }

    return {
      version,
      versionName: metadata.metadata.timestamp,
      content: await content.text(),
    };
  }

  async getItemMetadata(slug: string): Promise<VersionMetadata> {
    const storage = await this.getStorageClient();
    const { data, error } = await storage
      .from(ITEMS_BUCKET)
      .info(`${slug}/${DEFAULT_NAME}.md`);

    if (error) {
      log.error(`Error getting metadata for item ${slug}:`, error);
      throw new StorageError("Failed to get metadata");
    }

    if (!data.metadata?.title) {
      throw new StorageError("Failed to verify metadata contents");
    }

    // Backwards-compatible metadata defaults
    if (!data.metadata.textDirection) {
      data.metadata.textDirection = TextDirection.LTR;
    }
    if (!data.metadata.textLanguage) {
      data.metadata.textLanguage = "";
    }
    return data.metadata as VersionMetadata;
  }
}

// Export singleton instance
export const storage = new Storage();

// Export bound methods to preserve 'this' context
export const uploadItemContent = (
  slug: string,
  content: string,
  metadata: ExtractedMetadata,
): Promise<{
  versionName: string;
  status: Exclude<UploadStatus, UploadStatus.ERROR>;
}> => storage.uploadItemContent(slug, content, metadata);

export const getItemContent = (
  slug: string,
  version: string | null,
): Promise<{ version: string | null; versionName: string; content: string }> =>
  storage.getItemContent(slug, version);

export const getItemMetadata = (slug: string): Promise<VersionMetadata> =>
  storage.getItemMetadata(slug);
