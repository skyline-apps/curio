import { and, db, eq, sql } from "@web/db";
import { items, profileItems } from "@web/db/schema";
import { storage } from "@web/lib/storage";
import { APIRequest, APIResponse, APIResponseJSON } from "@web/utils/api";
import { checkUserProfile, parseAPIRequest } from "@web/utils/api/server";
import { createLogger } from "@web/utils/logger";

import {
  ReadItemRequestSchema,
  ReadItemResponse,
  ReadItemResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/read");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<ReadItemResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(ReadItemRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slug, readingProgress } = data;
    if (!slug) {
      return APIResponseJSON({ error: "No slug provided." }, { status: 400 });
    }

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
          eq(profileItems.profileId, profileResult.profile.id),
          sql`${items.slug} = ${slug}`,
        ),
      );

    if (!itemData || itemData.length === 0) {
      return APIResponseJSON({ error: "Item not found." }, { status: 404 });
    }
    const updatedFields: Partial<typeof profileItems.$inferInsert> = {
      readingProgress,
      lastReadAt: new Date(),
    };

    if (itemData[0].versionName === null) {
      const { timestamp } = await storage.getItemMetadata(itemData[0].slug);
      updatedFields.versionName = timestamp || null;
    }

    const updatedItems = await db
      .update(profileItems)
      .set(updatedFields)
      .from(items)
      .where(
        and(
          eq(profileItems.itemId, items.id),
          eq(profileItems.profileId, profileResult.profile.id),
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

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error reading item:", error);
    return APIResponseJSON({ error: "Error reading item." }, { status: 500 });
  }
}
