import { and, db, desc, eq, ilike, not, or, sql } from "@/db";
import {
  items,
  ItemState,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";
import { cleanUrl, generateSlug } from "@/utils/url";

import {
  CreateOrUpdateItemsRequestSchema,
  CreateOrUpdateItemsResponse,
  CreateOrUpdateItemsResponseSchema,
  GetItemsRequestSchema,
  GetItemsResponse,
  GetItemsResponseSchema,
  ItemResultSchema,
} from "./validation";

const log = createLogger("api/v1/items");

export const LABELS_CLAUSE = sql<
  Array<{ id: string; name: string; color: string }>
>`COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', pl.id,
          'name', pl.name,
          'color', pl.color
        )
      )
      FROM ${profileItemLabels} pil
      INNER JOIN ${profileLabels} pl ON pl.id = pil.label_id
      WHERE pil.profile_item_id = ${profileItems.id}
    ),
    '[]'
  )::json
`;

export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetItemsResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<GetItemsResponse>;
    }

    const url = new URL(request.url);
    const data = await parseAPIRequest(
      GetItemsRequestSchema,
      Object.fromEntries(url.searchParams),
    );
    if ("error" in data) {
      return data.error;
    }

    const { limit, slugs, urls, cursor, filters, search } = data;
    const cleanedUrls = urls?.map((url) => cleanUrl(url)) ?? [];

    const cursorCondition = cursor
      ? sql`${profileItems.stateUpdatedAt} < ${cursor}`
      : undefined;

    let whereClause = slugs
      ? and(
          eq(profileItems.profileId, profileResult.profile.id),
          sql`${items.slug} = ANY(ARRAY[${sql.join(slugs, sql`, `)}]::text[])`,
        )
      : urls
        ? and(
            eq(profileItems.profileId, profileResult.profile.id),
            sql`${items.url} = ANY(ARRAY[${sql.join(cleanedUrls, sql`, `)}]::text[])`,
          )
        : eq(profileItems.profileId, profileResult.profile.id);

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
    }

    if (search) {
      whereClause = and(
        whereClause,
        or(
          search ? ilike(profileItems.title, `%${search}%`) : undefined,
          search ? ilike(profileItems.description, `%${search}%`) : undefined,
          search ? ilike(items.url, `%${search}%`) : undefined,
        ),
      );
    }

    if (!filters || filters.state !== ItemState.DELETED) {
      whereClause = and(
        whereClause,
        not(eq(profileItems.state, ItemState.DELETED)),
      );
    }

    const results = await db
      .select({
        id: items.id,
        url: items.url,
        slug: items.slug,
        createdAt: items.createdAt,
        metadata: {
          title: profileItems.title,
          description: profileItems.description,
          author: profileItems.author,
          thumbnail: profileItems.thumbnail,
          favicon: profileItems.favicon,
          publishedAt: profileItems.publishedAt,
          savedAt: profileItems.savedAt,
          state: profileItems.state,
          isFavorite: profileItems.isFavorite,
          readingProgress: profileItems.readingProgress,
          lastReadAt: profileItems.lastReadAt,
          versionName: profileItems.versionName,
          stateUpdatedAt: profileItems.stateUpdatedAt,
        },
        labels: LABELS_CLAUSE,
      })
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(and(whereClause, cursorCondition))
      // TODO: Fix pagination bug if multiple items have the same stateUpdatedAt
      .orderBy(desc(profileItems.stateUpdatedAt), desc(items.id))
      .limit(limit);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(whereClause)
      .then((res) => Number(res[0]?.count ?? 0));

    const response: GetItemsResponse = GetItemsResponseSchema.parse({
      items: results.map((item) => ItemResultSchema.parse(item)),
      nextCursor:
        results.length === limit
          ? results[
              results.length - 1
            ].metadata.stateUpdatedAt?.toISOString() || undefined
          : undefined,
      total,
    });

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error fetching items:", error);
    return APIResponseJSON({ error: "Error fetching items." }, { status: 500 });
  }
}

export async function POST(
  request: APIRequest,
): Promise<APIResponse<CreateOrUpdateItemsResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(CreateOrUpdateItemsRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { items: newItems } = data;

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

      const profileItemsToInsert = newItems.map((item) => {
        const cleanedUrl = cleanUrl(item.url);
        const itemId = urlToItemId.get(cleanedUrl);
        if (!itemId) {
          throw new Error(
            `Failed to find itemId for URL ${item.url}. This should never happen.`,
          );
        }

        return {
          title: item.metadata?.title || cleanedUrl,
          description: item.metadata?.description || sql`NULL`,
          author: item.metadata?.author || sql`NULL`,
          thumbnail: item.metadata?.thumbnail || sql`NULL`,
          favicon: item.metadata?.favicon || sql`NULL`,
          publishedAt: item.metadata?.publishedAt
            ? new Date(item.metadata.publishedAt)
            : sql`NULL`,
          updatedAt: new Date(),
          profileId: profileResult.profile.id,
          state: ItemState.ACTIVE,
          stateUpdatedAt: item.metadata?.stateUpdatedAt
            ? new Date(item.metadata?.stateUpdatedAt)
            : new Date(),
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
            publishedAt: sql`COALESCE(EXCLUDED.published_at, ${profileItems.publishedAt})`,
            stateUpdatedAt: sql`CASE
              WHEN EXCLUDED.state <> profile_items.state THEN EXCLUDED.state_updated_at
              ELSE profile_items.state_updated_at
            END`,
            updatedAt: sql`now()`,
            state: ItemState.ACTIVE,
          },
        })
        .returning({
          itemId: profileItems.itemId,
          title: profileItems.title,
          description: profileItems.description,
          author: profileItems.author,
          thumbnail: profileItems.thumbnail,
          favicon: profileItems.favicon,
          publishedAt: profileItems.publishedAt,
          savedAt: profileItems.savedAt,
          state: profileItems.state,
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
            const { itemId: _itemId, ...metadataWithoutId } = metadata || {};
            return ItemResultSchema.parse({
              ...item,
              metadata: metadataWithoutId,
            });
          }),
        });

      return APIResponseJSON(response);
    });
  } catch (error) {
    log.error("Error creating items:", error);
    return APIResponseJSON({ error: "Error creating items." }, { status: 500 });
  }
}
