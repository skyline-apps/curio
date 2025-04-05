import { and, desc, eq, ilike, not, or, type SQL, sql } from "@api/db";
import {
  fetchOwnItemResults,
  getRelevantProfileItemIds,
} from "@api/db/dal/profileItems";
import { items, ItemState, profileItems, TextDirection } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { cleanUrl, generateSlug } from "@api/utils/url";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  CreateOrUpdateItemsRequest,
  CreateOrUpdateItemsRequestSchema,
  CreateOrUpdateItemsResponse,
  CreateOrUpdateItemsResponseSchema,
  GetItemsRequest,
  GetItemsRequestSchema,
  GetItemsResponse,
  GetItemsResponseSchema,
  ItemResultSchema,
  ItemResultWithoutLabelsSchema,
} from "./validation";

export const itemsRouter = new Hono<EnvBindings>()
  .get(
    "/",
    describeRoute(apiDoc("get", GetItemsRequestSchema, GetItemsResponseSchema)),
    zValidator(
      "query",
      GetItemsRequestSchema,
      parseError<GetItemsRequest, GetItemsResponse>,
    ),
    async (c): Promise<APIResponse<GetItemsResponse>> => {
      const profileId = c.get("profileId")!;
      try {
        const db = c.get("db");
        const { limit, slugs, urls, cursor, filters, search, offset } =
          c.req.valid("query");
        const cleanedUrls = urls?.map((url) => cleanUrl(url)) ?? [];
        const response: Partial<GetItemsResponse> = {};

        let whereClause: SQL<unknown> | undefined = eq(
          profileItems.profileId,
          profileId,
        );
        if (filters) {
          whereClause = and(
            whereClause,
            filters.state !== undefined
              ? eq(profileItems.state, filters.state)
              : undefined,
            filters.isFavorite !== undefined
              ? eq(profileItems.isFavorite, filters.isFavorite)
              : undefined,
          );
          if (filters.labels?.ids.length) {
            const { operator = "and", ids } = filters.labels;
            whereClause = and(
              whereClause,
              operator === "and"
                ? sql`NOT EXISTS (
              SELECT 1 FROM unnest(ARRAY[${sql.join(ids, sql`, `)}]::uuid[]) AS label_id
              WHERE label_id NOT IN (
                SELECT label_id FROM profile_item_labels
                WHERE profile_item_labels.profile_item_id = profile_items.id
              )
            )`
                : sql`EXISTS (
              SELECT 1 FROM profile_item_labels
              WHERE profile_item_labels.profile_item_id = profile_items.id
              AND label_id = ANY(ARRAY[${sql.join(ids, sql`, `)}]::uuid[])
            )`,
            );
          }
        }
        if (!filters || filters.state !== ItemState.DELETED) {
          whereClause = and(
            whereClause,
            not(eq(profileItems.state, ItemState.DELETED)),
          );
        }

        const { success, searchResults, nextOffset, total } =
          await getRelevantProfileItemIds(c, limit, offset, search);
        if (success) {
          response.nextOffset = nextOffset;
          response.total = total;
          if (searchResults.length === 0) {
            return c.json(
              GetItemsResponseSchema.parse({ ...response, items: [] }),
            );
          }
          whereClause = and(
            whereClause,
            sql`${items.slug} = ANY(ARRAY[${sql.join(
              searchResults.map((p) => sql`${p.slug}::text`),
              sql`, `,
            )}])`,
          );
        } else {
          // If search endpoint fails or is empty, fall back to applying all search conditions
          if (slugs) {
            whereClause = and(
              whereClause,
              sql`${items.slug} = ANY(ARRAY[${sql.join(slugs, sql`, `)}]::text[])`,
            );
          } else if (urls) {
            whereClause = and(
              whereClause,
              sql`${items.url} = ANY(ARRAY[${sql.join(cleanedUrls, sql`, `)}]::text[])`,
            );
          }
          if (search) {
            whereClause = and(
              whereClause,
              or(
                search ? ilike(profileItems.title, `%${search}%`) : undefined,
                search
                  ? ilike(profileItems.description, `%${search}%`)
                  : undefined,
                search ? ilike(items.url, `%${search}%`) : undefined,
              ),
            );
          }
          response.total = await db
            .select({ count: sql<number>`count(*)` })
            .from(items)
            .innerJoin(profileItems, eq(items.id, profileItems.itemId))
            .where(whereClause)
            .then((res) => Number(res[0]?.count ?? 0));
        }

        // Add in the cursor condition after calculating the total count
        if (cursor) {
          whereClause = and(
            whereClause,
            sql`${profileItems.stateUpdatedAt} < ${cursor}`,
          );
        }

        const results = await fetchOwnItemResults(db)
          .where(whereClause)
          .orderBy(desc(profileItems.stateUpdatedAt), desc(items.id))
          .limit(limit);

        if (success) {
          response.items = searchResults
            .filter((result) =>
              results.some((item) => item.slug === result.slug),
            )
            .map((result) =>
              ItemResultSchema.parse({
                ...results.find((item) => item.slug === result.slug),
                excerpt: result.excerpt,
              }),
            );
        } else {
          response.items = results.map((item) => ItemResultSchema.parse(item));
          response.nextCursor =
            results.length === limit
              ? results[
                  results.length - 1
                ].metadata.stateUpdatedAt?.toISOString() || undefined
              : undefined;
        }

        return c.json(GetItemsResponseSchema.parse(response));
      } catch (error) {
        log("Error fetching items:", error);
        return c.json({ error: "Error fetching items." }, 500);
      }
    },
  )
  .post(
    "/",
    describeRoute(
      apiDoc(
        "post",
        CreateOrUpdateItemsRequestSchema,
        CreateOrUpdateItemsResponseSchema,
      ),
    ),
    zValidator(
      "json",
      CreateOrUpdateItemsRequestSchema,
      parseError<CreateOrUpdateItemsRequest, CreateOrUpdateItemsResponse>,
    ),
    async (c) => {
      const profileId = c.get("profileId")!;
      try {
        const db = c.get("db");
        const { items: newItems } = c.req.valid("json");

        const now = new Date();

        return await db.transaction(async (tx) => {
          const itemsToInsert = newItems.map((item) => ({
            url: cleanUrl(item.url),
            slug: generateSlug(item.url),
            createdAt: now,
            updatedAt: now,
          }));

          const insertedItems = await tx
            .insert(items)
            .values(itemsToInsert)
            .onConflictDoUpdate({
              target: items.url,
              set: { slug: items.slug }, // Should be a no-op, needed to include the non-updated rows in the url to ID map
            })
            .returning({
              id: items.id,
              url: items.url,
              slug: items.slug,
              createdAt: items.createdAt,
            });

          const urlToItemId = new Map(
            insertedItems.map((item) => [item.url, item.id]),
          );

          const itemIds = insertedItems.map((item) => item.id);

          const stateUpdatedAtSet = new Set<string>();
          const profileItemsToInsert = newItems.map((item) => {
            const cleanedUrl = cleanUrl(item.url);
            const itemId = urlToItemId.get(cleanedUrl);
            if (!itemId) {
              throw new Error(
                `Failed to find itemId for URL ${item.url}. This should never happen.`,
              );
            }
            const itemIndex = itemIds.indexOf(itemId);

            // Calculate stateUpdatedAt value
            let stateUpdatedAt = item.metadata?.stateUpdatedAt
              ? new Date(item.metadata?.stateUpdatedAt)
              : new Date(new Date().getTime() + itemIndex);

            // Check for duplicate stateUpdatedAt values
            const stateUpdatedAtStr = stateUpdatedAt.toISOString();
            if (stateUpdatedAtSet.has(stateUpdatedAtStr)) {
              stateUpdatedAt = new Date(stateUpdatedAt.getTime() + 1);
            }
            stateUpdatedAtSet.add(stateUpdatedAtStr);

            return {
              title: item.metadata?.title || cleanedUrl,
              description: item.metadata?.description || sql`NULL`,
              author: item.metadata?.author || sql`NULL`,
              thumbnail: item.metadata?.thumbnail || sql`NULL`,
              favicon: item.metadata?.favicon || sql`NULL`,
              textDirection: item.metadata?.textDirection || TextDirection.LTR,
              textLanguage: item.metadata?.textLanguage || "",
              publishedAt: item.metadata?.publishedAt
                ? new Date(item.metadata.publishedAt)
                : sql`NULL`,
              updatedAt: new Date(),
              profileId,
              state: ItemState.ACTIVE,
              stateUpdatedAt,
              itemId,
            };
          });

          const insertedMetadata = await tx
            .insert(profileItems)
            .values(profileItemsToInsert)
            .onConflictDoUpdate({
              target: [profileItems.profileId, profileItems.itemId],
              set: {
                title: sql`CASE
              WHEN EXCLUDED.title = (SELECT url FROM items WHERE id = profile_items.item_id) THEN COALESCE(profile_items.title, EXCLUDED.title)
              ELSE EXCLUDED.title
            END`,
                description: sql`COALESCE(EXCLUDED.description, ${profileItems.description})`,
                author: sql`COALESCE(EXCLUDED.author, ${profileItems.author})`,
                thumbnail: sql`COALESCE(EXCLUDED.thumbnail, ${profileItems.thumbnail})`,
                favicon: sql`COALESCE(EXCLUDED.favicon, ${profileItems.favicon})`,
                textDirection: sql`COALESCE(EXCLUDED.text_direction, ${profileItems.textDirection})`,
                textLanguage: sql`COALESCE(EXCLUDED.text_language, ${profileItems.textLanguage})`,
                publishedAt: sql`COALESCE(EXCLUDED.published_at, ${profileItems.publishedAt})`,
                stateUpdatedAt: sql`CASE
              WHEN EXCLUDED.state <> profile_items.state
              THEN EXCLUDED.state_updated_at
              ELSE profile_items.state_updated_at
            END`,
                updatedAt: sql`now()`,
                state: ItemState.ACTIVE,
              },
            })
            .returning({
              profileItemId: profileItems.id,
              itemId: profileItems.itemId,
              title: profileItems.title,
              description: profileItems.description,
              author: profileItems.author,
              thumbnail: profileItems.thumbnail,
              favicon: profileItems.favicon,
              textDirection: profileItems.textDirection,
              textLanguage: profileItems.textLanguage,
              publishedAt: profileItems.publishedAt,
              savedAt: profileItems.savedAt,
              state: profileItems.state,
              source: profileItems.source,
              isFavorite: profileItems.isFavorite,
              readingProgress: profileItems.readingProgress,
              lastReadAt: profileItems.lastReadAt,
              versionName: profileItems.versionName,
            });

          const response: CreateOrUpdateItemsResponse =
            CreateOrUpdateItemsResponseSchema.parse({
              items: insertedItems.map((item) => {
                const metadata = insertedMetadata.find(
                  (metadata) => metadata.itemId === item.id,
                );
                const {
                  itemId: _itemId,
                  profileItemId,
                  ...metadataWithoutId
                } = metadata || {};
                return ItemResultWithoutLabelsSchema.parse({
                  ...item,
                  profileItemId,
                  metadata: metadataWithoutId,
                });
              }),
            });

          return c.json(response);
        });
      } catch (error) {
        log("Error creating items:", error);
        return c.json({ error: "Error creating items." }, 500);
      }
    },
  );
