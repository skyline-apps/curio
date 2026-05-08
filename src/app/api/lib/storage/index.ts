import { ExtractedMetadata } from "@app/api/lib/extract/types";
import { StorageError } from "@app/api/lib/storage/types";
import { TextDirection } from "@app/schemas/db";
import { UploadStatus } from "@app/schemas/types";
import { R2Bucket } from "@cloudflare/workers-types";
import { createHash } from "crypto";

import { type VersionMetadata } from "./types";

const DEFAULT_NAME = "default";
const SUMMARY_NAME = "summary";

export type StorageEnv = {
  ITEMS_BUCKET?: R2Bucket;
  IMPORT_BUCKET?: R2Bucket;
};

export class Storage {
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
    if (!env.ITEMS_BUCKET) {
      throw new StorageError("R2 ITEMS_BUCKET binding is missing");
    }

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
    if (!env.ITEMS_BUCKET) {
      throw new StorageError("R2 ITEMS_BUCKET binding is missing");
    }

    const versionPath = version
      ? `${slug}/versions/${version}.md`
      : `${slug}/${DEFAULT_NAME}.md`;
    const summaryPath = version
      ? `${slug}/versions/${version}.summary.md`
      : `${slug}/${SUMMARY_NAME}.md`;

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
      summaryText = fallbackSummaryObj ? await fallbackSummaryObj.text() : null;
    }

    const metadata = contentObj.customMetadata as unknown as VersionMetadata;

    return {
      version,
      versionName: metadata.timestamp,
      content: await contentObj.text(),
      summary: summaryText,
    };
  }

  async getItemMetadata(
    env: StorageEnv,
    slug: string,
  ): Promise<VersionMetadata> {
    if (!env.ITEMS_BUCKET) {
      throw new StorageError("R2 ITEMS_BUCKET binding is missing");
    }

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

  async uploadItemSummary(
    env: StorageEnv,
    slug: string,
    version: string | null,
    summary: string,
  ): Promise<void> {
    if (!env.ITEMS_BUCKET) {
      throw new StorageError("R2 ITEMS_BUCKET binding is missing");
    }

    const summaryPath = version
      ? `${slug}/versions/${version}.summary.md`
      : `${slug}/summary.md`;

    await env.ITEMS_BUCKET.put(summaryPath, summary, {
      httpMetadata: { contentType: "text/markdown" },
    });
  }

  async uploadImportFile(
    env: StorageEnv,
    objectKey: string,
    file: File,
  ): Promise<void> {
    if (!env.IMPORT_BUCKET) {
      throw new StorageError("R2 IMPORT_BUCKET binding is missing");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await env.IMPORT_BUCKET.put(objectKey, file as any, {
      httpMetadata: { contentType: file.type },
    });
  }

  async readImportFile(env: StorageEnv, objectKey: string): Promise<Blob> {
    if (!env.IMPORT_BUCKET) {
      throw new StorageError("R2 IMPORT_BUCKET binding is missing");
    }

    const obj = await env.IMPORT_BUCKET.get(objectKey);
    if (!obj) {
      throw new StorageError("Failed to read file from R2");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await obj.blob()) as any;
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
