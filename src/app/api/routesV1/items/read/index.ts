import { and, eq, sql } from "@app/api/db";
import { items, profileItems } from "@app/api/db/schema";
import { storage } from "@app/api/lib/storage";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import {
  ReadItemRequest,
  ReadItemRequestSchema,
  ReadItemResponse,
  ReadItemResponseSchema,
} from "@app/schemas/v1/items/read";
import { Hono } from "hono";

export const itemsReadRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(apiDoc("post", ReadItemRequestSchema, ReadItemResponseSchema)),
  zValidator(
    "json",
    ReadItemRequestSchema,
    parseError<ReadItemRequest, ReadItemResponse>,
  ),
  async (c): Promise<APIResponse<ReadItemResponse>> => {
    const profileId = c.get("profileId")!;
    try {
      const { slug, readingProgress } = c.req.valid("json");
      const db = c.get("db");

      const itemData = await db
        .select({
          id: items.id,
          slug: items.slug,
          versionName: profileItems.versionName,
        })
        .from(profileItems)
        .innerJoin(items, eq(profileItems.itemId, items.id))
        .where(
          and(
            eq(profileItems.profileId, profileId),
            sql`${items.slug} = ${slug}`,
          ),
        );

      if (!itemData || itemData.length === 0) {
        return c.json({ error: "Item not found." }, 404);
      }
      const updatedFields: Partial<typeof profileItems.$inferInsert> = {
        readingProgress,
        lastReadAt: new Date(),
      };

      if (itemData[0].versionName === null) {
        const { timestamp } = await storage.getItemMetadata(
          c,
          itemData[0].slug,
        );
        updatedFields.versionName = timestamp || null;
      }

      const updatedItems = await db
        .update(profileItems)
        .set(updatedFields)
        .from(items)
        .where(
          and(
            eq(profileItems.itemId, items.id),
            eq(profileItems.profileId, profileId),
            sql`${items.slug} = ${slug}`,
          ),
        )
        .returning({
          slug: items.slug,
          readingProgress: profileItems.readingProgress,
          versionName: profileItems.versionName,
        });

      const response: ReadItemResponse = ReadItemResponseSchema.parse(
        updatedItems[0],
      );

      return c.json(response);
    } catch (error) {
      log("Error reading item:", error);
      return c.json({ error: "Error reading item." }, 500);
    }
  },
);
