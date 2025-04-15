import { eq } from "@app/api/db";
import { updateProfileItem } from "@app/api/db/dal/profileItems";
import { items, profiles } from "@app/api/db/schema";
import {
  extractMetadataFromEmail,
  extractUrlFromEmail,
  parseIncomingEmail,
} from "@app/api/lib/email";
import { EmailError } from "@app/api/lib/email/types";
import { extractFromHtml } from "@app/api/lib/extract";
import { ExtractError } from "@app/api/lib/extract/types";
import { indexItemDocuments } from "@app/api/lib/search";
import { SearchError } from "@app/api/lib/search/types";
import { storage } from "@app/api/lib/storage";
import { StorageError } from "@app/api/lib/storage/types";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import { generateSlug } from "@app/api/utils/url";
import { ItemSource } from "@app/schemas/db";
import { UploadStatus } from "@app/schemas/types";
import {
  UploadEmailRequest,
  UploadEmailRequestSchema,
  UploadEmailResponse,
  UploadEmailResponseSchema,
} from "@app/schemas/v1/public/items/email";
import { Hono } from "hono";

export const publicItemsEmailRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", UploadEmailRequestSchema, UploadEmailResponseSchema),
  ),
  zValidator(
    "json",
    UploadEmailRequestSchema,
    parseError<UploadEmailRequest, UploadEmailResponse>,
  ),
  async (c): Promise<APIResponse<UploadEmailResponse>> => {
    const log = c.get("log");
    const requestSecret = c.req.header("x-curio-app-secret");
    const appSecret = c.env.CURIO_APP_SECRET;
    if (!appSecret || requestSecret !== appSecret) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { emailBody } = c.req.valid("json");

    try {
      // Decode base64 email content back to raw MIME format
      const rawEmail = Buffer.from(emailBody, "base64").toString("binary");
      const email = await parseIncomingEmail(
        c.env.CURIO_EMAIL_DOMAIN,
        rawEmail,
      );
      if (!email) {
        return c.json({ error: "Failed to parse email" }, 400);
      }
      const db = c.get("db");

      const profileResult = await db
        .select()
        .from(profiles)
        .where(eq(profiles.newsletterEmail, email.recipient))
        .limit(1);

      if (!profileResult[0]) {
        return c.json(
          { error: "Failed to identify user from recipient email" },
          401,
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

        let content = email.textContent || "";
        if (email.htmlContent) {
          try {
            const result = await extractFromHtml(itemUrl, email.htmlContent);
            content = result.content;
          } catch (error) {
            if (error instanceof ExtractError) {
              log.error("Failed to extract content from email", {
                slug: itemSlug,
                error,
              });
            }
          }
        }

        const { versionName, status } = await storage.uploadItemContent(
          c,
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
          { source: ItemSource.EMAIL, versionName },
        );

        // Index profile item with new main content
        if (status === UploadStatus.UPDATED_MAIN) {
          await indexItemDocuments(c, [
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
        }
        return c.json(response);
      });
    } catch (error) {
      if (error instanceof EmailError) {
        log.error("Failed to parse email", { error });
        return c.json(
          {
            status: UploadStatus.ERROR,
            error: "Failed to parse email",
          },
          400,
        );
      } else if (error instanceof StorageError) {
        log.error("Failed to store content", { error });
        return c.json(
          {
            status: UploadStatus.ERROR,
            error: "Failed to store content",
          },
          500,
        );
      } else if (error instanceof SearchError) {
        log.error("Failed to index content", { error });
        return c.json(
          {
            status: UploadStatus.ERROR,
            error: "Failed to index content",
          },
          500,
        );
      }
      log.error("Unexpected error", { error });
      return c.json(
        {
          status: UploadStatus.ERROR,
          error: "Unexpected error saving email content",
        },
        500,
      );
    }
  },
);
