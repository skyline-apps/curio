import { and, db, eq, sql } from "@web/db";
import {
  items,
  ItemState,
  profileItemHighlights,
  profileItems,
} from "@web/db/schema";
import { deleteHighlightDocuments } from "@web/lib/search";
import { APIRequest, APIResponse, APIResponseJSON } from "@web/utils/api";
import { checkUserProfile, parseAPIRequest } from "@web/utils/api/server";
import { createLogger } from "@web/utils/logger";

import {
  UpdateStateRequestSchema,
  UpdateStateResponse,
  UpdateStateResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/state");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateStateResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdateStateRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slugs, state } = data;
    if (!slugs || slugs.length === 0) {
      return APIResponseJSON({ error: "No slugs provided." }, { status: 400 });
    }

    const now = new Date();

    return await db.transaction(async (tx) => {
      const updatedItems = await tx
        .update(profileItems)
        .set({
          stateUpdatedAt: sql`${sql.raw("'" + now.toISOString() + "'::timestamp")} + (array_position(ARRAY[${sql.join(slugs, sql`, `)}]::text[], ${items.slug})::integer * interval '1 millisecond')`,
          state,
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
          stateUpdatedAt: profileItems.stateUpdatedAt,
          profileItemId: profileItems.id,
        });

      if (updatedItems.length && state === ItemState.DELETED) {
        const updatedProfileItemIds = updatedItems.map(
          (item) => item.profileItemId,
        );
        const deletedHighlights = await tx
          .delete(profileItemHighlights)
          .where(
            and(
              sql`${profileItemHighlights.profileItemId} = ANY(ARRAY[${sql.join(updatedProfileItemIds, sql`, `)}]::uuid[])`,
            ),
          )
          .returning({
            highlightId: profileItemHighlights.id,
          });

        if (deletedHighlights.length) {
          await deleteHighlightDocuments(
            deletedHighlights.map((h) => h.highlightId),
          );
        }
      }

      const response: UpdateStateResponse = UpdateStateResponseSchema.parse({
        updated: updatedItems,
      });

      return APIResponseJSON(response);
    });
  } catch (error) {
    log.error("Error updating item states:", error);
    return APIResponseJSON(
      { error: "Error updating item states." },
      { status: 500 },
    );
  }
}
