import { createHash } from "crypto";

import { UploadStatus } from "@/app/api/v1/items/content/validation";
import { createLogger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";
import type { StorageClient } from "@/utils/supabase/types";

import { ITEMS_BUCKET } from "./constants";

const log = createLogger("utils/storage");
const DEFAULT_NAME = "default";

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

interface VersionMetadata {
  timestamp: string;
  length: number;
  hash: string;
}

export class Storage {
  private storage: StorageClient | null = null;
  private lastInitTime: number = 0;
  private readonly REFRESH_INTERVAL = 3600000; // 1 hour in milliseconds

  private async getStorageClient(): Promise<StorageClient> {
    const now = Date.now();
    if (!this.storage || now - this.lastInitTime > this.REFRESH_INTERVAL) {
      const supabase = await createClient();
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
  ): Promise<Exclude<UploadStatus, UploadStatus.ERROR>> {
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
          const metadata: VersionMetadata = JSON.parse(
            version.metadata?.version || "{}",
          );
          if (metadata.hash === contentHash) {
            log.info("Content already exists, skipping upload", {
              slug,
              hash: contentHash,
            });
            return UploadStatus.SKIPPED;
          }
        } catch (e) {
          log.error("Failed to parse version metadata", {
            error: e,
            version,
          });
        }
      }
    }

    // Check current main file content length
    try {
      const { data: currentData } = await storage
        .from(ITEMS_BUCKET)
        .download(`${slug}/${DEFAULT_NAME}.md`);

      if (currentData) {
        const currentContent = await currentData.text();
        if (currentContent.length >= content.length) {
          // Current content is longer, just store the new version
          const versionPath = `${slug}/versions/${timestamp}.md`;
          const metadata: VersionMetadata = {
            timestamp,
            length: content.length,
            hash: contentHash,
          };

          const { error: versionError } = await storage
            .from(ITEMS_BUCKET)
            .upload(versionPath, content, {
              contentType: "text/markdown",
              upsert: false,
              metadata: { version: JSON.stringify(metadata) },
            });

          if (versionError) {
            log.error(
              `Error uploading version for item ${slug}:`,
              versionError,
            );
            throw new StorageError("Failed to upload version");
          }
          return UploadStatus.STORED_VERSION;
        }
      }
    } catch (error) {
      // Main file doesn't exist yet, or error reading it
      log.info("No existing content for ${slug} or error reading it:", error);
    }

    // This is either the first version or a longer version than current
    const versionPath = `${slug}/versions/${timestamp}.md`;
    const metadata: VersionMetadata = {
      timestamp,
      length: content.length,
      hash: contentHash,
    };

    // Upload as new version
    const { error: versionError } = await storage
      .from(ITEMS_BUCKET)
      .upload(versionPath, content, {
        contentType: "text/markdown",
        upsert: false,
        metadata: { version: JSON.stringify(metadata) },
      });

    if (versionError) {
      log.error(`Error uploading version for item ${slug}:`, versionError);
      throw new StorageError("Failed to upload version");
    }

    // Update main file since this is longer
    const { error: mainError } = await storage
      .from(ITEMS_BUCKET)
      .upload(`${slug}/${DEFAULT_NAME}.md`, content, {
        contentType: "text/markdown",
        upsert: true,
      });

    if (mainError) {
      log.error(`Error updating main file for item ${slug}:`, mainError);
      throw new StorageError("Failed to update main file");
    }

    return UploadStatus.UPDATED_MAIN;
  }

  async getItemContent(slug: string): Promise<string> {
    const storage = await this.getStorageClient();
    const { data, error } = await storage
      .from(ITEMS_BUCKET)
      .download(`${slug}/${DEFAULT_NAME}.md`);

    if (error) {
      log.error(`Error downloading content for item ${slug}:`, error);
      throw new StorageError("Failed to download content");
    }

    return await data.text();
  }

  async listItemVersions(slug: string): Promise<VersionMetadata[]> {
    const storage = await this.getStorageClient();
    const { data: files, error } = await storage
      .from(ITEMS_BUCKET)
      .list(`${slug}/versions`);

    if (error) {
      log.error(`Error listing versions for item ${slug}:`, error);
      throw new StorageError("Failed to list versions");
    }

    return files
      .map((file) => {
        try {
          return JSON.parse(file.metadata?.version || "{}") as VersionMetadata;
        } catch (e) {
          log.error(`Error parsing metadata for ${file.name}:`, e);
          return null;
        }
      })
      .filter((metadata): metadata is VersionMetadata => metadata !== null)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }
}

// Export singleton instance
export const storage = new Storage();

// Export individual methods for convenience
export const { uploadItemContent, getItemContent, listItemVersions } = storage;
