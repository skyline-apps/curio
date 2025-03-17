import { updateProfileItem } from "@/app/api/v1/items/content/updateProfileItem";
import { db, eq } from "@/db";
import { items, ItemSource, profiles } from "@/db/schema";
import {
  extractMetadataFromEmail,
  extractUrlFromEmail,
  parseIncomingEmail,
} from "@/lib/email";
import { EmailError } from "@/lib/email/types";
import { extractMainContentAsMarkdown } from "@/lib/extract";
import { ExtractedMetadata } from "@/lib/extract/types";
import { indexDocuments } from "@/lib/search";
import { storage } from "@/lib/storage";
import { StorageError, UploadStatus } from "@/lib/storage/types";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";
import { generateSlug } from "@/utils/url";

import {
  UploadEmailRequestSchema,
  UploadEmailResponse,
  UploadEmailResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/email");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UploadEmailResponse>> {
  const appSecret = request.headers.get("x-curio-app-secret");
  if (
    !process.env.CURIO_APP_SECRET ||
    appSecret !== process.env.CURIO_APP_SECRET
  ) {
    return APIResponseJSON({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const data = await parseAPIRequest(UploadEmailRequestSchema, body);
  if ("error" in data) {
    return data.error;
  }

  try {
    // Decode base64 email content back to raw MIME format
    const rawEmail = Buffer.from(data.emailBody, "base64").toString("binary");
    const email = await parseIncomingEmail(rawEmail);
    if (!email) {
      return APIResponseJSON(
        { error: "Failed to parse email" },
        { status: 400 },
      );
    }

    const profileResult = await db
      .select()
      .from(profiles)
      .where(eq(profiles.newsletterEmail, email.recipient))
      .limit(1);

    if (!profileResult[0]) {
      return APIResponseJSON(
        { error: "Failed to identify user from recipient email" },
        { status: 401 },
      );
    }

    const itemUrl = extractUrlFromEmail(email);
    const itemSlug = generateSlug(itemUrl);
    const metadata = extractMetadataFromEmail(email);

    return await db.transaction(async (tx) => {
      const item = await tx
        .insert(items)
        .values({
          url: itemUrl,
          slug: itemSlug,
        })
        .onConflictDoUpdate({
          target: items.url,
          set: { slug: itemSlug },
        })
        .returning({
          id: items.id,
          slug: items.slug,
          url: items.url,
        });

      const itemId = item[0].id;
      const newDate = new Date();

      const { content, textDirection } = await extractMainContentAsMarkdown(
        itemUrl,
        email.htmlContent || email.content,
      );

      const { versionName, status } = await storage.uploadItemContent(
        itemSlug,
        content,
        metadata,
      );
      const response: UploadEmailResponse = UploadEmailResponseSchema.parse({
        status,
        slug: itemSlug,
        message:
          status === UploadStatus.UPDATED_MAIN
            ? "Content updated and set as main version"
            : status === UploadStatus.SKIPPED
              ? "Content already exists"
              : "Content updated",
      });
      if (status === UploadStatus.UPDATED_MAIN) {
        await tx
          .update(items)
          .set({ updatedAt: newDate })
          .where(eq(items.id, item[0].id));

        await updateProfileItem(
          tx,
          itemUrl,
          profileResult[0].id,
          itemId,
          metadata,
          newDate,
          { textDirection, source: ItemSource.EMAIL },
        );

        // Index profile item with new main content
        await indexDocuments([
          {
            slug: itemSlug,
            url: itemUrl,
            title: metadata.title || itemUrl,
            description: metadata.description ?? undefined,
            author: metadata.author ?? undefined,
            content,
            contentVersionName: versionName,
          },
        ]);
        return APIResponseJSON(response);
      } else if (
        status === UploadStatus.STORED_VERSION ||
        status === UploadStatus.SKIPPED
      ) {
        const defaultMetadata = await storage.getItemMetadata(itemSlug);
        const newMetadata = { ...metadata };
        Object.entries(defaultMetadata).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            newMetadata[key as keyof ExtractedMetadata] = value;
          }
        });
        // Update item metadata and clear reading state
        await updateProfileItem(
          tx,
          itemUrl,
          profileResult[0].id,
          itemId,
          newMetadata,
          newDate,
          { textDirection, source: ItemSource.EMAIL },
        );
        return APIResponseJSON(response);
      } else {
        log.error("Upload error", { status: status });
        return APIResponseJSON(
          { error: "Error uploading item content." },
          { status: 500 },
        );
      }
    });
  } catch (error) {
    if (error instanceof EmailError) {
      log.error("Failed to parse email", { error });
      return APIResponseJSON(
        {
          status: UploadStatus.ERROR,
          error: "Failed to parse email",
        },
        { status: 400 },
      );
    } else if (error instanceof StorageError) {
      log.error("Failed to store content", { error });
      return APIResponseJSON(
        {
          status: UploadStatus.ERROR,
          error: "Failed to store content",
        },
        { status: 500 },
      );
    }
    log.error("Unexpected error", { error });
    return APIResponseJSON(
      {
        status: UploadStatus.ERROR,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
