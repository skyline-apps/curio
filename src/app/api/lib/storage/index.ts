import { ExtractedMetadata } from "@app/api/lib/extract/types";
import { StorageError } from "@app/api/lib/storage/types";
import { type StorageClient } from "@app/api/lib/supabase/client";
import { TextDirection } from "@app/schemas/db";
import { UploadStatus } from "@app/schemas/types";
import { createServerClient } from "@supabase/ssr"; // eslint-disable-line no-restricted-imports
import { createHash } from "crypto";

import { type VersionMetadata } from "./types";

const DEFAULT_NAME = "default";
const ITEMS_BUCKET = "items";

export type StorageEnv = {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

export class Storage {
  private storage: StorageClient | null = null;
  private lastInitTime: number = 0;
  private readonly REFRESH_INTERVAL = 3600000; // 1 hour in milliseconds

  private async getStorageClient(env: StorageEnv): Promise<StorageClient> {
    const now = Date.now();
    if (!this.storage || now - this.lastInitTime > this.REFRESH_INTERVAL) {
      const supabase = createServerClient(
        env.VITE_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
        },
      );
      this.storage = supabase.storage;
      this.lastInitTime = now;

      try {
        // Verify we can access the bucket
        await this.storage.from(ITEMS_BUCKET).list();
      } catch (error) {
        // Reset storage client to force re-initialization on next attempt
        this.storage = null;
        if (error instanceof Error) {
          throw new StorageError(
            `Failed to initialize storage client: ${error.message}`,
          );
        }
        throw new StorageError(`Failed to initialize storage client: ${error}`);
      }
    }
    return this.storage;
  }

  private computeContentHash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  async uploadItemContent(
    env: StorageEnv,
    slug: string,
    content: string,
    metadata: ExtractedMetadata,
  ): Promise<{
    versionName: string;
    status: Exclude<UploadStatus, UploadStatus.ERROR>;
  }> {
    const storage = await this.getStorageClient(env);
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
            return {
              versionName: version.name,
              status: UploadStatus.SKIPPED,
            };
          }
        } catch (_) {}
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
    } catch (_) {
      throw new StorageError("Failed to serialize version metadata");
    }

    // Check current main file content length
    let defaultMetadata: VersionMetadata | null = null;
    try {
      const { data } = await storage
        .from(ITEMS_BUCKET)
        .info(`${slug}/${DEFAULT_NAME}.md`);
      defaultMetadata = (data?.metadata as VersionMetadata) || null;
    } catch (_) {}

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
      throw new StorageError("Failed to update main file");
    }

    return { versionName: timestamp, status: UploadStatus.UPDATED_MAIN };
  }

  async getItemContent(
    env: StorageEnv,
    slug: string,
    version: string | null,
  ): Promise<{ version: string | null; versionName: string; content: string }> {
    const storage = await this.getStorageClient(env);
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
        return this.getItemContent(env, slug, null);
      } else {
        throw new StorageError("Failed to download content");
      }
    }

    return {
      version,
      versionName: metadata.metadata.timestamp,
      content: await content.text(),
    };
  }

  async getItemMetadata(
    env: StorageEnv,
    slug: string,
  ): Promise<VersionMetadata> {
    const storage = await this.getStorageClient(env);
    const { data, error } = await storage
      .from(ITEMS_BUCKET)
      .info(`${slug}/${DEFAULT_NAME}.md`);

    if (error) {
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
  env: StorageEnv,
  slug: string,
  content: string,
  metadata: ExtractedMetadata,
): Promise<{
  versionName: string;
  status: Exclude<UploadStatus, UploadStatus.ERROR>;
}> => storage.uploadItemContent(env, slug, content, metadata);

export const getItemContent = (
  env: StorageEnv,
  slug: string,
  version: string | null,
): Promise<{ version: string | null; versionName: string; content: string }> =>
  storage.getItemContent(env, slug, version);

export const getItemMetadata = (
  env: StorageEnv,
  slug: string,
): Promise<VersionMetadata> => storage.getItemMetadata(env, slug);
