import { and, db, eq, inArray, sql } from "@/db";
import { items, profileItemHighlights, profileItems } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  CreateOrUpdateHighlightRequestSchema,
  CreateOrUpdateHighlightResponse,
  CreateOrUpdateHighlightResponseSchema,
  DeleteHighlightRequestSchema,
  DeleteHighlightResponse,
  DeleteHighlightResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/highlights");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<CreateOrUpdateHighlightResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(
      CreateOrUpdateHighlightRequestSchema,
      body,
    );
    if ("error" in data) {
      return data.error;
    }

    const { slug, highlights } = data;
    if (!slug) {
      return APIResponseJSON({ error: "No slug provided." }, { status: 400 });
    }

    const profileItem = await db
      .select({
        id: profileItems.id,
      })
      .from(profileItems)
      .innerJoin(items, eq(profileItems.itemId, items.id))
      .where(
        and(
          eq(profileItems.profileId, profileResult.profile.id),
          eq(items.slug, slug),
        ),
      )
      .limit(1);

    if (!profileItem.length) {
      return APIResponseJSON(
        { error: "Item not found for the given slug" },
        { status: 404 },
      );
    }

    const highlightsWithProfileItemId = highlights.map((h) => ({
      id: h.id,
      profileItemId: profileItem[0].id,
      startOffset: h.startOffset,
      endOffset: h.endOffset,
      text: h.text,
      note: h.note,
    }));

    const savedHighlights = await db
      .insert(profileItemHighlights)
      .values(highlightsWithProfileItemId)
      .onConflictDoUpdate({
        target: profileItemHighlights.id,
        where: eq(profileItemHighlights.profileItemId, profileItem[0].id),
        set: {
          startOffset: sql`excluded.start_offset`,
          endOffset: sql`excluded.end_offset`,
          text: sql`excluded.text`,
          note: sql`excluded.note`,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    const response = CreateOrUpdateHighlightResponseSchema.parse({
      highlights: savedHighlights.map((h) => ({
        id: h.id,
        startOffset: h.startOffset,
        endOffset: h.endOffset,
        text: h.text,
        note: h.note,
        createdAt: h.createdAt,
      })),
    });

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error creating/updating highlights", { error });
    return APIResponseJSON(
      { error: "Failed to create/update highlights" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: APIRequest,
): Promise<APIResponse<DeleteHighlightResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(DeleteHighlightRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slug, highlightIds } = data;

    const profileItem = await db
      .select({
        id: profileItems.id,
      })
      .from(profileItems)
      .innerJoin(items, eq(profileItems.itemId, items.id))
      .where(
        and(
          eq(profileItems.profileId, profileResult.profile.id),
          eq(items.slug, slug),
        ),
      )
      .limit(1);

    if (!profileItem.length) {
      return APIResponseJSON(
        { error: "Item not found for the given slug" },
        { status: 404 },
      );
    }

    const deletedHighlights = await db
      .delete(profileItemHighlights)
      .where(
        and(
          inArray(profileItemHighlights.id, highlightIds),
          eq(profileItemHighlights.profileItemId, profileItem[0].id),
        ),
      )
      .returning();

    const response = DeleteHighlightResponseSchema.parse({
      deleted: deletedHighlights.map((h) => ({ id: h.id })),
    });

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error deleting highlights", { error });
    return APIResponseJSON(
      { error: "Failed to delete highlights" },
      { status: 500 },
    );
  }
}
