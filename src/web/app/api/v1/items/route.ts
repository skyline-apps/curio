import { and, db, eq, sql } from "@/db";
import { items, profileItems } from "@/db/schema";
import {
  APIRequest,
  APIResponse,
  APIResponseJSON,
  checkUserProfile,
  parseAPIRequest,
} from "@/utils/api";
import { createLogger } from "@/utils/logger";
import { cleanUrl, generateSlug } from "@/utils/url";

import {
  CreateOrUpdateItemsRequestSchema,
  CreateOrUpdateItemsResponse,
  GetItemsRequestSchema,
  GetItemsResponse,
} from "./validation";

const log = createLogger("api/v1/items");

export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetItemsResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
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

    const { limit, slugs } = data;

    const results = await db
      .select({
        id: items.id,
        url: items.url,
        slug: items.slug,
        title: items.title,
        description: items.description,
        author: items.author,
        thumbnail: items.thumbnail,
        publishedAt: items.publishedAt,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        savedAt: profileItems.savedAt,
      })
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(
        slugs
          ? and(
              eq(profileItems.profileId, profileResult.profile.id),
              sql`${items.slug} = ANY(${slugs})`,
            )
          : eq(profileItems.profileId, profileResult.profile.id),
      )
      .orderBy(sql`${profileItems.savedAt} DESC`)
      .limit(limit);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(eq(profileItems.profileId, profileResult.profile.id))
      .then((res) => Number(res[0]?.count ?? 0));

    const response: GetItemsResponse = {
      items: results.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        url: item.url,
        slug: item.slug,
        title: item.title || "",
        description: item.description || "",
        author: item.author || "",
        thumbnail: item.thumbnail || "",
        publishedAt: item.publishedAt?.toISOString() || "",
      })),
      total,
      nextCursor:
        results.length === limit ? results[results.length - 1].id : undefined,
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
  try {
    const profileResult = await checkUserProfile(userId);
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
    const itemsToInsert = newItems.map((item) => ({
      url: cleanUrl(item.url),
      slug: generateSlug(item.url),
      title: item.title,
      description: item.description,
      author: item.author,
      thumbnail: item.thumbnail,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      createdAt: now,
      updatedAt: now,
    }));

    // Insert items
    const insertedItems = await db
      .insert(items)
      .values(itemsToInsert)
      .onConflictDoUpdate({
        target: items.url,
        set: {
          updatedAt: now,
          title: sql`EXCLUDED.title`,
          description: sql`EXCLUDED.description`,
          author: sql`EXCLUDED.author`,
          thumbnail: sql`EXCLUDED.thumbnail`,
          publishedAt: sql`EXCLUDED.published_at`,
        },
      })
      .returning();

    // Link items to profile if link doesn't exist
    await db
      .insert(profileItems)
      .values(
        insertedItems.map((item) => ({
          profileId: profileResult.profile.id,
          itemId: item.id,
          savedAt: now,
        })),
      )
      .onConflictDoNothing({
        target: [profileItems.profileId, profileItems.itemId],
      });

    const response: CreateOrUpdateItemsResponse = {
      items: insertedItems.map((item) => ({
        id: item.id,
        url: item.url,
        title: item.title ?? undefined,
        description: item.description ?? undefined,
        author: item.author ?? undefined,
        thumbnail: item.thumbnail ?? undefined,
        publishedAt: item.publishedAt?.toISOString() ?? undefined,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    };

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error creating items:", error);
    return APIResponseJSON({ error: "Error creating items." }, { status: 500 });
  }
}
