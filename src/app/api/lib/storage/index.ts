import { ExtractedMetadata } from "@app/api/lib/extract/types";
import { StorageError } from "@app/api/lib/storage/types";
import { type StorageClient } from "@app/api/lib/supabase/client";
import { TextDirection } from "@app/schemas/db";
import { UploadStatus } from "@app/schemas/types";
import { R2Bucket } from "@cloudflare/workers-types";
import { createServerClient } from "@supabase/ssr"; // eslint-disable-line no-restricted-imports
import { createHash } from "crypto";

import { type VersionMetadata } from "./types";

const DEFAULT_NAME = "default";
const SUMMARY_NAME = "summary";
const ITEMS_BUCKET_NAME = "items";
const IMPORT_BUCKET_NAME = "imports";

export type StorageEnv = {
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ITEMS_BUCKET?: R2Bucket;
  IMPORT_BUCKET?: R2Bucket;
};

export class Storage {
  private supabaseStorage: StorageClient | null = null;
  private lastInitTime: number = 0;
  private readonly REFRESH_INTERVAL = 3600000; // 1 hour in milliseconds

  private async getSupabaseClient(env: StorageEnv): Promise<StorageClient> {
    if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new StorageError("Supabase credentials missing");
    }
    const now = Date.now();
    if (
      !this.supabaseStorage ||
      now - this.lastInitTime > this.REFRESH_INTERVAL
    ) {
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
      this.supabaseStorage = supabase.storage;
      this.lastInitTime = now;

      try {
        // Verify we can access the bucket
        await this.supabaseStorage.from(ITEMS_BUCKET_NAME).list();
      } catch (error) {
        // Reset storage client to force re-initialization on next attempt
        this.supabaseStorage = null;
        if (error instanceof Error) {
          throw new StorageError(
            `Failed to initialize storage client: ${error.message}`,
          );
        }
        throw new StorageError(`Failed to initialize storage client: ${error}`);
      }
    }
    return this.supabaseStorage;
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
    const timestamp = new Date().toISOString();
    const contentHash = this.computeContentHash(content);
    const versionName = timestamp;

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

    if (env.ITEMS_BUCKET) {
      const defaultObj = await env.ITEMS_BUCKET.head(
        `${slug}/${DEFAULT_NAME}.md`,
      );
      const defaultMetadata =
        (defaultObj?.customMetadata as unknown as VersionMetadata) || null;

      const versionPath = `${slug}/versions/${timestamp}.md`;
      await env.ITEMS_BUCKET.put(versionPath, content, {
        customMetadata: fileMetadata as unknown as Record<string, string>,
        httpMetadata: { contentType: "text/markdown" },
      });

      if (defaultMetadata?.length && defaultMetadata.length >= content.length) {
        return {
          versionName,
          status: UploadStatus.STORED_VERSION,
        };
      }

      // Update main file
      await env.ITEMS_BUCKET.put(`${slug}/${DEFAULT_NAME}.md`, content, {
        customMetadata: fileMetadata as unknown as Record<string, string>,
        httpMetadata: { contentType: "text/markdown" },
      });

      return { versionName, status: UploadStatus.UPDATED_MAIN };
    }

    // Fallback to Supabase
    const storage = await this.getSupabaseClient(env);

    // Check if this exact content already exists
    const { data: existingVersions } = await storage
      .from(ITEMS_BUCKET_NAME)
      .list(`${slug}/versions`);

    if (existingVersions?.length) {
      for (const version of existingVersions) {
        try {
          const { data, error } = await storage
            .from(ITEMS_BUCKET_NAME)
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

    // Check current main file content length
    let defaultMetadata: VersionMetadata | null = null;
    try {
      const { data } = await storage
        .from(ITEMS_BUCKET_NAME)
        .info(`${slug}/${DEFAULT_NAME}.md`);
      defaultMetadata = (data?.metadata as VersionMetadata) || null;
    } catch (_) {}

    const versionPath = `${slug}/versions/${timestamp}.md`;

    // Upload as new version
    const { error: versionError } = await storage
      .from(ITEMS_BUCKET_NAME)
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
      .from(ITEMS_BUCKET_NAME)
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
  ): Promise<{
    version: string | null;
    versionName: string;
    content: string;
    summary: string | null;
  }> {
    const versionPath = version
      ? `${slug}/versions/${version}.md`
      : `${slug}/${DEFAULT_NAME}.md`;
    const summaryPath = version
      ? `${slug}/versions/${version}.summary.md`
      : `${slug}/${SUMMARY_NAME}.md`;

    if (env.ITEMS_BUCKET) {
      const contentObj = await env.ITEMS_BUCKET.get(versionPath);
      if (!contentObj) {
        if (version) {
          return this.getItemContent(env, slug, null);
        }
        throw new StorageError("Failed to download content from R2");
      }

      const summaryObj = await env.ITEMS_BUCKET.get(summaryPath);
      let summaryText: string | null = summaryObj
        ? await summaryObj.text()
        : null;

      if (!summaryText && version !== null) {
        const fallbackSummaryObj = await env.ITEMS_BUCKET.get(
          `${slug}/${SUMMARY_NAME}.md`,
        );
        summaryText = fallbackSummaryObj
          ? await fallbackSummaryObj.text()
          : null;
      }

      const metadata = contentObj.customMetadata as unknown as VersionMetadata;

      return {
        version,
        versionName: metadata.timestamp,
        content: await contentObj.text(),
        summary: summaryText,
      };
    }

    const storage = await this.getSupabaseClient(env);
    const { data: content, error } = await storage
      .from(ITEMS_BUCKET_NAME)
      .download(versionPath);
    const { data: summary, error: summaryError } = await storage
      .from(ITEMS_BUCKET_NAME)
      .download(summaryPath);
    const { data: metadata, error: metadataError } = await storage
      .from(ITEMS_BUCKET_NAME)
      .info(versionPath);

    let fallbackSummaryData;
    if (summaryError && version !== null) {
      fallbackSummaryData = await storage
        .from(ITEMS_BUCKET_NAME)
        .download(`${slug}/${SUMMARY_NAME}.md`);
    }

    if (error || metadataError || !metadata.metadata) {
      if (version) {
        return this.getItemContent(env, slug, null);
      } else {
        throw new StorageError("Failed to download content from Supabase");
      }
    }

    return {
      version,
      versionName: (metadata.metadata as VersionMetadata).timestamp,
      content: await content.text(),
      summary: summary
        ? await summary.text()
        : fallbackSummaryData?.data
          ? await fallbackSummaryData.data.text()
          : null,
    };
  }

  async getItemMetadata(
    env: StorageEnv,
    slug: string,
  ): Promise<VersionMetadata> {
    if (env.ITEMS_BUCKET) {
      const obj = await env.ITEMS_BUCKET.head(`${slug}/${DEFAULT_NAME}.md`);
      if (!obj) {
        throw new StorageError("Failed to get metadata from R2");
      }
      const metadata = obj.customMetadata as unknown as VersionMetadata;
      if (!metadata.title) {
        throw new StorageError("Failed to verify metadata contents from R2");
      }
      return {
        ...metadata,
        textDirection: metadata.textDirection || TextDirection.LTR,
        textLanguage: metadata.textLanguage || "",
      };
    }

    const storage = await this.getSupabaseClient(env);
    const { data, error } = await storage
      .from(ITEMS_BUCKET_NAME)
      .info(`${slug}/${DEFAULT_NAME}.md`);

    if (error) {
      throw new StorageError("Failed to get metadata from Supabase");
    }

    const metadata = data.metadata as VersionMetadata;
    if (!metadata?.title) {
      throw new StorageError(
        "Failed to verify metadata contents from Supabase",
      );
    }

    return {
      ...metadata,
      textDirection: metadata.textDirection || TextDirection.LTR,
      textLanguage: metadata.textLanguage || "",
    };
  }

  async uploadItemSummary(
    env: StorageEnv,
    slug: string,
    version: string | null,
    summary: string,
  ): Promise<void> {
    const summaryPath = version
      ? `${slug}/versions/${version}.summary.md`
      : `${slug}/summary.md`;

    if (env.ITEMS_BUCKET) {
      await env.ITEMS_BUCKET.put(summaryPath, summary, {
        httpMetadata: { contentType: "text/markdown" },
      });
      return;
    }

    const storage = await this.getSupabaseClient(env);
    const { error } = await storage
      .from(ITEMS_BUCKET_NAME)
      .upload(summaryPath, summary, {
        contentType: "text/markdown",
        upsert: true,
      });
    if (error) {
      throw new StorageError("Failed to upload summary to Supabase");
    }
  }

  async uploadImportFile(
    env: StorageEnv,
    objectKey: string,
    file: File,
  ): Promise<void> {
    if (env.IMPORT_BUCKET) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await env.IMPORT_BUCKET.put(objectKey, file as any, {
        httpMetadata: { contentType: file.type },
      });
      return;
    }

    const storage = await this.getSupabaseClient(env);
    const { error } = await storage
      .from(IMPORT_BUCKET_NAME)
      .upload(objectKey, file);
    if (error) {
      throw new StorageError("Failed to upload file to Supabase");
    }
  }

  async readImportFile(env: StorageEnv, objectKey: string): Promise<Blob> {
    if (env.IMPORT_BUCKET) {
      const obj = await env.IMPORT_BUCKET.get(objectKey);
      if (!obj) {
        throw new StorageError("Failed to read file from R2");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (await obj.blob()) as any;
    }

    const storage = await this.getSupabaseClient(env);
    const { data, error } = await storage
      .from(IMPORT_BUCKET_NAME)
      .download(objectKey);
    if (error) {
      throw new StorageError("Failed to read file from Supabase");
    }
    return data;
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
): Promise<{
  version: string | null;
  versionName: string;
  content: string;
  summary: string | null;
}> => storage.getItemContent(env, slug, version);

export const getItemMetadata = (
  env: StorageEnv,
  slug: string,
): Promise<VersionMetadata> => storage.getItemMetadata(env, slug);

export const uploadItemSummary = (
  env: StorageEnv,
  slug: string,
  version: string | null,
  summary: string,
): Promise<void> => storage.uploadItemSummary(env, slug, version, summary);
