import { and, db, eq, inArray, isNull, not, or, sql } from "@/db";
import { items, ItemState, profileItems } from "@/db/schema";
import { getItemMetadata } from "@/lib/storage";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  SaveRequestSchema,
  SaveResponse,
  SaveResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/save");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<SaveResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(SaveRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slugs } = data;
    if (!slugs || slugs.length === 0) {
      return APIResponseJSON({ error: "No slugs provided." }, { status: 400 });
    }

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
          eq(profileItems.profileId, profileResult.profile.id),
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
      return APIResponseJSON(SaveResponseSchema.parse({ updated: [] }), {
        status: 200,
      });
    }

    const baseDate = new Date();
    const itemsWithMetadata = await Promise.all(
      itemsToSave.map(async (item, index) => {
        const metadata = await getItemMetadata(item.slug);
        const newDate = new Date(baseDate.getTime() + index);
        return {
          itemId: item.id,
          profileId: profileResult.profile.id,
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

    return APIResponseJSON(
      SaveResponseSchema.parse({
        updated: itemsToSave.map((item) => ({
          slug: item.slug,
          profileItemId: updatedItems.find((i) => i.itemId === item.id)
            ?.profileItemId,
        })),
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    log.error("Error saving items:", error);
    return APIResponseJSON({ error: "Error saving items." }, { status: 500 });
  }
}
