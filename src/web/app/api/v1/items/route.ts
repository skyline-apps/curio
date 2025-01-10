import { and, db, eq, sql } from "@/db";
import { items, profileItems } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { createLogger } from "@/utils/logger";
import { cleanUrl, generateSlug } from "@/utils/url";

import { checkUserProfile } from "./utils";
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

  const profileResult = await checkUserProfile(userId);
  if (profileResult.error) {
    return profileResult.error;
  }

  const url = new URL(request.url);
  const parsed = GetItemsRequestSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path =
        issue.path.length !== undefined ? issue.path.join(".") : issue.path;
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    const message = errors.join("\n");
    return APIResponseJSON(
      { error: `Invalid request parameters:\n${message}` },
      { status: 400 },
    );
  }

  const { limit, slugs } = parsed.data;

  try {
    const baseQuery = db
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
      .innerJoin(profileItems, eq(items.id, profileItems.itemId));

    // Get items with conditions
    const results = await baseQuery
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

    // Format response
    const response: GetItemsResponse = {
      items: results.map((item) => ({
        id: item.id,
        url: item.url,
        slug: item.slug,
        title: item.title ?? undefined,
        description: item.description ?? undefined,
        author: item.author ?? undefined,
        thumbnail: item.thumbnail ?? undefined,
        publishedAt: item.publishedAt?.toISOString() ?? undefined,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
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

  const profileResult = await checkUserProfile(userId);
  if (profileResult.error) {
    return profileResult.error;
  }

  try {
    const body = await request.json();
    const parsed = CreateOrUpdateItemsRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => {
        const path =
          issue.path.length !== undefined ? issue.path.join(".") : issue.path;
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      const message = errors.join("\n");
      return APIResponseJSON(
        { error: `Invalid request body:\n${message}` },
        { status: 400 },
      );
    }

    const { items: newItems } = parsed.data;

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
