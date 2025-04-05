import { eq } from "@api/db";
import { updateProfileItem } from "@api/db/dal/profileItems";
import { items, ItemSource, profiles } from "@api/db/schema";
import {
  extractMetadataFromEmail,
  extractUrlFromEmail,
  parseIncomingEmail,
} from "@api/lib/email";
import { EmailError } from "@api/lib/email/types";
import { extractMainContentAsMarkdown } from "@api/lib/extract";
import { indexItemDocuments } from "@api/lib/search";
import { storage } from "@api/lib/storage";
import { StorageError, UploadStatus } from "@api/lib/storage/types";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { generateSlug } from "@api/utils/url";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  UploadEmailRequest,
  UploadEmailRequestSchema,
  UploadEmailResponse,
  UploadEmailResponseSchema,
} from "./validation";

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

        const { content } = await extractMainContentAsMarkdown(
          itemUrl,
          email.htmlContent || email.content,
        );

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
        log("Failed to parse email", { error });
        return c.json(
          {
            status: UploadStatus.ERROR,
            error: "Failed to parse email",
          },
          400,
        );
      } else if (error instanceof StorageError) {
        log("Failed to store content", { error });
        return c.json(
          {
            status: UploadStatus.ERROR,
            error: "Failed to store content",
          },
          500,
        );
      }
      log("Unexpected error", { error });
      return c.json(
        {
          status: UploadStatus.ERROR,
          error: "Internal server error",
        },
        500,
      );
    }
  },
);
