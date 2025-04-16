import { and, desc, eq, ilike, not, or, type SQL, sql } from "@app/api/db";
import { createOrUpdateItems } from "@app/api/db/dal/items";
import {
  createOrUpdateProfileItems,
  fetchOwnItemResults,
  getRelevantProfileItemIds,
} from "@app/api/db/dal/profileItems";
import { items, profileItems } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import { cleanUrl } from "@app/api/utils/url";
import { ItemState } from "@app/schemas/db";
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
} from "@app/schemas/v1/items";
import { Hono } from "hono";

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
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      const { limit, slugs, urls, cursor, filters, search, offset } =
        c.req.valid("query");
      try {
        const db = c.get("db");
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
        log.error("Error fetching items", {
          error,
          profileId,
          slugs,
          urls,
          search,
        });
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
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      const { items: newItems } = c.req.valid("json");
      try {
        const db = c.get("db");

        return await db.transaction(async (tx) => {
          const insertedItems = await createOrUpdateItems(
            tx,
            newItems.map((item) => item.url),
          );

          const insertedMetadata = await createOrUpdateProfileItems(
            tx,
            profileId,
            insertedItems,
            newItems,
          );

          const response: CreateOrUpdateItemsResponse =
            CreateOrUpdateItemsResponseSchema.parse({
              items: insertedItems.map((item) => {
                const metadata = insertedMetadata.find(
                  (metadata) => metadata.itemId === item.id,
                );
                const {
                  itemId: _itemId,
                  id: profileItemId,
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
        log.error("Error creating items", {
          error,
          profileId,
          urls: newItems.map((item) => item.url),
        });
        return c.json({ error: "Error creating items." }, 500);
      }
    },
  );
