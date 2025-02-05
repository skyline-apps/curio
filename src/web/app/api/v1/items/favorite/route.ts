import { and, db, eq, sql } from "@/db";
import { items, profileItems } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  UpdateFavoriteRequestSchema,
  UpdateFavoriteResponse,
  UpdateFavoriteResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/favorite");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateFavoriteResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdateFavoriteRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slugs, favorite } = data;
    if (!slugs || slugs.length === 0) {
      return APIResponseJSON({ error: "No slugs provided." }, { status: 400 });
    }

    const updatedItems = await db
      .update(profileItems)
      .set({
        isFavorite: favorite,
      })
      .from(items)
      .where(
        and(
          eq(profileItems.itemId, items.id),
          eq(profileItems.profileId, profileResult.profile.id),
          sql`${items.slug} = ANY(ARRAY[${sql.join(slugs, sql`, `)}]::text[])`,
        ),
      )
      .returning({
        slug: items.slug,
      });

    const response: UpdateFavoriteResponse = UpdateFavoriteResponseSchema.parse(
      {
        updated: updatedItems,
      },
    );

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error favoriting items:", error);
    return APIResponseJSON(
      { error: "Error favoriting items." },
      { status: 500 },
    );
  }
}
