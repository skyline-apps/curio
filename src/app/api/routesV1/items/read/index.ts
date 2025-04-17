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
import {
  MarkUnreadItemRequest,
  MarkUnreadItemRequestSchema,
  MarkUnreadItemResponse,
  MarkUnreadItemResponseSchema,
  ReadItemRequest,
  ReadItemRequestSchema,
  ReadItemResponse,
  ReadItemResponseSchema,
} from "@app/schemas/v1/items/read";
import { Hono } from "hono";

export const itemsReadRouter = new Hono<EnvBindings>()
  .post(
    "/",
    describeRoute(
      apiDoc("post", ReadItemRequestSchema, ReadItemResponseSchema),
    ),
    zValidator(
      "json",
      ReadItemRequestSchema,
      parseError<ReadItemRequest, ReadItemResponse>,
    ),
    async (c): Promise<APIResponse<ReadItemResponse>> => {
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      const { slug, readingProgress } = c.req.valid("json");
      try {
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
            c.env,
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
        log.error("Error reading item", { error, profileId, slug });
        return c.json({ error: "Error reading item." }, 500);
      }
    },
  )
  .delete(
    "/",
    describeRoute(
      apiDoc(
        "delete",
        MarkUnreadItemRequestSchema,
        MarkUnreadItemResponseSchema,
      ),
    ),
    zValidator(
      "json",
      MarkUnreadItemRequestSchema,
      parseError<MarkUnreadItemRequest, MarkUnreadItemResponse>,
    ),
    async (c): Promise<APIResponse<MarkUnreadItemResponse>> => {
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      const { slug } = c.req.valid("json");

      try {
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
          readingProgress: 0,
          lastReadAt: null,
        };

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
          });

        const response: MarkUnreadItemResponse =
          MarkUnreadItemResponseSchema.parse(updatedItems[0]);

        return c.json(response);
      } catch (error) {
        log.error("Error reading item", { error, profileId, slug });
        return c.json({ error: "Error reading item." }, 500);
      }
    },
  );
