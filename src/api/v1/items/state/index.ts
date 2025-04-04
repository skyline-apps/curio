import { and, eq, getDb, sql } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import {
  items,
  ItemState,
  profileItemHighlights,
  profileItems,
} from "@api/db/schema";
import { deleteHighlightDocuments } from "@api/lib/search";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  UpdateStateRequest,
  UpdateStateRequestSchema,
  UpdateStateResponse,
  UpdateStateResponseSchema,
} from "./validation";

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
    const userId = c.get("userId");
    try {
      const profileResult = await checkUserProfile(c, userId);
      if (profileResult.error) {
        return profileResult.error;
      }

      const { slugs, state } = c.req.valid("json");
      if (!slugs || slugs.length === 0) {
        return c.json({ error: "No slugs provided." }, 400);
      }

      const now = new Date();
      const db = getDb(c);

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
