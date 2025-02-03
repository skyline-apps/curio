import { and, db, eq, sql } from "@/db";
import { items, profileItems } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";
import { cleanUrl, generateSlug } from "@/utils/url";

import {
  CreateOrUpdateItemsRequestSchema,
  CreateOrUpdateItemsResponse,
  GetItemsRequestSchema,
  GetItemsResponse,
  ItemResultSchema,
} from "./validation";

const log = createLogger("api/v1/items");

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

    const { limit, slugs, urls, cursor } = data;
    const cleanedUrls = urls?.map((url) => cleanUrl(url)) ?? [];

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

    if (cursor) {
      const cursorCondition = sql`${items.id} < ${cursor}`;
      whereClause = and(whereClause, cursorCondition);
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
          publishedAt: profileItems.publishedAt,
          savedAt: profileItems.savedAt,
        },
      })
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(whereClause)
      .orderBy(sql`${profileItems.savedAt} DESC`)
      .limit(limit);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(eq(profileItems.profileId, profileResult.profile.id))
      .then((res) => Number(res[0]?.count ?? 0));

    const response: GetItemsResponse = {
      items: results.map((item) => ItemResultSchema.parse(item)),
      nextCursor:
        results.length === limit ? results[results.length - 1].id : undefined,
      total,
    };

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
          description: item.metadata?.description || null,
          author: item.metadata?.author || null,
          thumbnail: item.metadata?.thumbnail || null,
          publishedAt: item.metadata?.publishedAt
            ? new Date(item.metadata.publishedAt)
            : null,
          updatedAt: now,
          profileId: profileResult.profile.id,
          itemId,
        };
      });

      const insertedMetadata = await tx
        .insert(profileItems)
        .values(profileItemsToInsert)
        .onConflictDoUpdate({
          target: [profileItems.profileId, profileItems.itemId],
          set: {
            title: sql`COALESCE(NULLIF(EXCLUDED.title, ''), ${profileItems.title})`,
            description: sql`COALESCE(EXCLUDED.description, ${profileItems.description})`,
            author: sql`COALESCE(EXCLUDED.author, ${profileItems.author})`,
            thumbnail: sql`COALESCE(EXCLUDED.thumbnail, ${profileItems.thumbnail})`,
            publishedAt: sql`COALESCE(EXCLUDED.published_at, ${profileItems.publishedAt})`,
            updatedAt: sql`now()`,
          },
        })
        .returning({
          itemId: profileItems.itemId,
          title: profileItems.title,
          description: profileItems.description,
          author: profileItems.author,
          thumbnail: profileItems.thumbnail,
          publishedAt: profileItems.publishedAt,
          savedAt: profileItems.savedAt,
        });

      const response: CreateOrUpdateItemsResponse = {
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
      };

      return APIResponseJSON(response);
    });
  } catch (error) {
    log.error("Error creating items:", error);
    return APIResponseJSON({ error: "Error creating items." }, { status: 500 });
  }
}
