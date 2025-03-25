import { and, db, eq, inArray, sql } from "@web/db";
import { items, profileItemLabels, profileItems } from "@web/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@web/utils/api";
import { checkUserProfile, parseAPIRequest } from "@web/utils/api/server";
import { createLogger } from "@web/utils/logger";

import {
  BulkDeleteLabelsRequestSchema,
  BulkDeleteLabelsResponse,
  BulkDeleteLabelsResponseSchema,
  UpdateLabelsRequestSchema,
  UpdateLabelsResponse,
  UpdateLabelsResponseSchema,
} from "./validation";

const log = createLogger("api/v1/items/labels");

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateLabelsResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdateLabelsRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slugs, labelIds } = data;
    if (!slugs || slugs.length === 0) {
      return APIResponseJSON({ error: "No slugs provided." }, { status: 400 });
    }

    const insertValues = await db
      .select({
        profileItemId: profileItems.id,
        slug: items.slug,
        labelId: sql<string>`unnest(ARRAY[${sql.join(
          labelIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )}])`.as("labelId"),
      })
      .from(profileItems)
      .innerJoin(items, eq(profileItems.itemId, items.id))
      .where(
        and(
          eq(profileItems.profileId, profileResult.profile.id),
          inArray(items.slug, slugs),
        ),
      );

    if (!insertValues.length) {
      return APIResponseJSON(
        { error: "No valid labels provided." },
        { status: 404 },
      );
    }

    await db
      .insert(profileItemLabels)
      .values(insertValues)
      .onConflictDoNothing();

    const updatedSlugs = new Set(insertValues.map((v) => v.slug));

    const response = UpdateLabelsResponseSchema.parse({
      updated: Array.from(updatedSlugs).map((slug) => ({ slug })),
    });
    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error updating labels", { error });
    return APIResponseJSON(
      { error: "Failed to update labels" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: APIRequest,
): Promise<APIResponse<BulkDeleteLabelsResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    const body = await request.json();
    const data = await parseAPIRequest(BulkDeleteLabelsRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slugs, labelIds } = data;
    if (!slugs || slugs.length === 0) {
      return APIResponseJSON({ error: "No slugs provided." }, { status: 400 });
    }

    const labelsToDelete = await db
      .select({
        profileItemLabelId: profileItemLabels.id,
        labelId: profileItemLabels.labelId,
        slug: items.slug,
      })
      .from(profileItemLabels)
      .innerJoin(
        profileItems,
        eq(profileItems.id, profileItemLabels.profileItemId),
      )
      .innerJoin(items, eq(profileItems.itemId, items.id))
      .where(
        and(
          eq(profileItems.profileId, profileResult.profile.id),
          inArray(profileItemLabels.labelId, labelIds),
          inArray(items.slug, slugs),
        ),
      );

    await db
      .delete(profileItemLabels)
      .where(
        inArray(
          profileItemLabels.id,
          labelsToDelete.map((row) => row.profileItemLabelId),
        ),
      )
      .returning({
        profileItemId: profileItemLabels.profileItemId,
        labelId: profileItemLabels.labelId,
      });

    const deletedSlugs = new Set(labelsToDelete.map((row) => row.slug));

    const response = BulkDeleteLabelsResponseSchema.parse({
      deleted: Array.from(deletedSlugs).map((slug) => ({ slug })),
    });

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error deleting labels", { error });
    return APIResponseJSON(
      { error: "Failed to delete labels" },
      { status: 500 },
    );
  }
}
