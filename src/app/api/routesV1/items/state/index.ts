import { and, eq, sql } from "@app/api/db";
import { items, profileItemHighlights, profileItems } from "@app/api/db/schema";
import { deleteHighlightDocuments } from "@app/api/lib/search";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { ItemState } from "@app/schemas/db";
import {
  UpdateStateRequest,
  UpdateStateRequestSchema,
  UpdateStateResponse,
  UpdateStateResponseSchema,
} from "@app/schemas/v1/items/state";
import { Hono } from "hono";

export const itemsStateRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", UpdateStateRequestSchema, UpdateStateResponseSchema),
  ),
  zValidator(
    "json",
    UpdateStateRequestSchema,
    parseError<UpdateStateRequest, UpdateStateResponse>,
  ),
  async (c): Promise<APIResponse<UpdateStateResponse>> => {
    const profileId = c.get("profileId")!;
    try {
      const { slugs, state } = c.req.valid("json");
      if (!slugs || slugs.length === 0) {
        return c.json({ error: "No slugs provided." }, 400);
      }

      const now = new Date();
      const db = c.get("db");

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
              eq(profileItems.profileId, profileId),
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
              c,
              deletedHighlights.map((h) => h.highlightId),
            );
          }
        }

        const response: UpdateStateResponse = UpdateStateResponseSchema.parse({
          updated: updatedItems,
        });

        return c.json(response);
      });
    } catch (error) {
      log("Error updating item states:", error);
      return c.json({ error: "Error updating item states." }, 500);
    }
  },
);
