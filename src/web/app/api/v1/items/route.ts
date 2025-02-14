import { and, db, desc, eq, ilike, not, or, type SQL, sql } from "@/db";
import {
  items,
  ItemState,
  ItemStateNumber,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@/db/schema";
import { searchDocuments } from "@/lib/search";
import { SearchError } from "@/lib/search/types";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";
import { cleanUrl, generateSlug } from "@/utils/url";

import {
  CreateOrUpdateItemsRequestSchema,
  CreateOrUpdateItemsResponse,
  CreateOrUpdateItemsResponseSchema,
  Filters,
  GetItemsRequestSchema,
  GetItemsResponse,
  GetItemsResponseSchema,
  ItemResultSchema,
  ItemResultWithoutLabelsSchema,
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

async function getRelevantProfileItemIds(
  profileId: string,
  limit: number,
  offset: number,
  search?: string,
  filters?: Filters,
): Promise<
  | { success: false; searchResults: null; nextOffset: null; total: null }
  | {
      success: true;
      searchResults: { id: string; excerpt: string }[];
      nextOffset: number | undefined;
      total: number;
    }
> {
  if (!search) {
    return {
      success: false,
      searchResults: null,
      nextOffset: null,
      total: null,
    };
  }
  try {
    const searchFilters = [];
    if (filters?.isFavorite !== undefined) {
      searchFilters.push(`isFavorite = ${filters.isFavorite ? 1 : 0}`);
    }
    if (filters && filters.state !== undefined) {
      searchFilters.push(`state = ${ItemStateNumber[filters.state]}`);
    } else {
      searchFilters.push(`state != ${ItemStateNumber[ItemState.DELETED]}`);
    }
    const { hits, estimatedTotalHits } = await searchDocuments(
      search,
      profileId,
      {
        filter: searchFilters,
        offset,
        limit: limit,
        attributesToRetrieve: ["profileItemId"],
        attributesToCrop: ["content"],
        attributesToHighlight: ["content"],
      },
    );

    const hasNextPage = estimatedTotalHits > offset + limit;
    const items = hits;
    const nextOffset = hasNextPage ? offset + limit : undefined;
    return {
      success: true,
      searchResults: items.map((item) => ({
        id: item.profileItemId,
        excerpt: item._formatted.content || "",
      })),
      nextOffset,
      total: estimatedTotalHits,
    };
  } catch (error) {
    if (error instanceof SearchError) {
      log.error(
        `Failed to search items for ${search}, falling back to normal search: ${error.message}`,
      );
      return {
        success: false,
        searchResults: null,
        nextOffset: null,
        total: null,
      };
    }
    throw error;
  }
}

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

    const { limit, slugs, urls, cursor, filters, search, offset } = data;
    const cleanedUrls = urls?.map((url) => cleanUrl(url)) ?? [];
    const response: Partial<GetItemsResponse> = {};

    let whereClause: SQL<unknown> | undefined = eq(
      profileItems.profileId,
      profileResult.profile.id,
    );

    const { success, searchResults, nextOffset, total } =
      await getRelevantProfileItemIds(
        profileResult.profile.id,
        limit,
        offset,
        search,
        filters,
      );
    if (success) {
      response.nextOffset = nextOffset;
      response.total = total;
      if (searchResults.length === 0) {
        return APIResponseJSON(
          GetItemsResponseSchema.parse({ ...response, items: [] }),
        );
      }
      whereClause = and(
        whereClause,
        sql`${profileItems.id} = ANY(ARRAY[${sql.join(
          searchResults.map((p) => sql`${p.id}::uuid`),
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

    const results = await db
      .select({
        id: items.id,
        url: items.url,
        slug: items.slug,
        createdAt: items.createdAt,
        profileItemId: profileItems.id,
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
      .where(whereClause)
      // TODO: Fix pagination bug if multiple items have the same stateUpdatedAt
      .orderBy(desc(profileItems.stateUpdatedAt), desc(items.id))
      .limit(limit);

    if (success) {
      response.items = searchResults.map((result) =>
        ItemResultSchema.parse({
          ...results.find((item) => item.profileItemId === result.id),
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

    return APIResponseJSON(GetItemsResponseSchema.parse(response));
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

      const itemIds = insertedItems.map((item) => item.id);

      const profileItemsToInsert = newItems.map((item) => {
        const cleanedUrl = cleanUrl(item.url);
        const itemId = urlToItemId.get(cleanedUrl);
        if (!itemId) {
          throw new Error(
            `Failed to find itemId for URL ${item.url}. This should never happen.`,
          );
        }
        const itemIndex = itemIds.indexOf(itemId);

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
            : new Date(new Date().getTime() + itemIndex),
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

      return APIResponseJSON(response);
    });
  } catch (error) {
    log.error("Error creating items:", error);
    return APIResponseJSON({ error: "Error creating items." }, { status: 500 });
  }
}
