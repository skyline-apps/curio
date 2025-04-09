import { and, eq, inArray, isNull, not, or, sql } from "@app/api/db";
import { items, profileItems } from "@app/api/db/schema";
import { getItemMetadata } from "@app/api/lib/storage";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { ItemState } from "@app/schemas/db";
import {
  SaveRequest,
  SaveRequestSchema,
  SaveResponse,
  SaveResponseSchema,
} from "@app/schemas/v1/items/save";
import { Hono } from "hono";

export const itemsSaveRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(apiDoc("post", SaveRequestSchema, SaveResponseSchema)),
  zValidator("json", SaveRequestSchema, parseError<SaveRequest, SaveResponse>),
  async (c): Promise<APIResponse<SaveResponse>> => {
    const profileId = c.get("profileId")!;
    try {
      const { slugs } = c.req.valid("json");
      if (!slugs || slugs.length === 0) {
        return c.json({ error: "No slugs provided." }, 400);
      }

      const db = c.get("db");
      const itemsToSave = await db
        .select({
          id: items.id,
          slug: items.slug,
          url: items.url,
        })
        .from(items)
        .leftJoin(
          profileItems,
          and(
            eq(profileItems.itemId, items.id),
            eq(profileItems.profileId, profileId),
          ),
        )
        .where(
          and(
            inArray(items.slug, slugs),
            or(
              isNull(profileItems.id),
              not(eq(profileItems.state, ItemState.ACTIVE)),
            ),
          ),
        );

      if (!itemsToSave.length) {
        return c.json(SaveResponseSchema.parse({ updated: [] }), 200);
      }

      const baseDate = new Date();
      const itemsWithMetadata = await Promise.all(
        itemsToSave.map(async (item, index) => {
          const metadata = await getItemMetadata(c, item.slug);
          const newDate = new Date(baseDate.getTime() + index);
          return {
            itemId: item.id,
            profileId,
            title: metadata.title || item.url,
            description: metadata.description,
            thumbnail: metadata.thumbnail,
            favicon: metadata.favicon,
            publishedAt: metadata.publishedAt
              ? new Date(metadata.publishedAt)
              : null,
            savedAt: newDate,
            state: ItemState.ACTIVE,
            stateUpdatedAt: newDate,
          };
        }),
      );

      const updatedItems = await db
        .insert(profileItems)
        .values(itemsWithMetadata)
        .onConflictDoUpdate({
          target: [profileItems.profileId, profileItems.itemId],
          set: {
            title: sql`EXCLUDED.title`,
            description: sql`EXCLUDED.description`,
            thumbnail: sql`EXCLUDED.thumbnail`,
            favicon: sql`EXCLUDED.favicon`,
            publishedAt: sql`EXCLUDED.published_at`,
            savedAt: sql`EXCLUDED.saved_at`,
            state: sql`EXCLUDED.state`,
            stateUpdatedAt: sql`EXCLUDED.state_updated_at`,
          },
        })
        .returning({
          profileItemId: profileItems.id,
          itemId: profileItems.itemId,
        });

      return c.json(
        SaveResponseSchema.parse({
          updated: itemsToSave.map((item) => ({
            slug: item.slug,
            profileItemId: updatedItems.find((i) => i.itemId === item.id)
              ?.profileItemId,
          })),
        }),
        200,
      );
    } catch (error) {
      log("Error saving items:", error);
      return c.json({ error: "Error saving items." }, 500);
    }
  },
);
