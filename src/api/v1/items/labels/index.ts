import { and, eq, getDb, inArray, sql } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import { items, profileItemLabels, profileItems } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  BulkDeleteLabelsRequest,
  BulkDeleteLabelsRequestSchema,
  BulkDeleteLabelsResponse,
  BulkDeleteLabelsResponseSchema,
  UpdateLabelsRequest,
  UpdateLabelsRequestSchema,
  UpdateLabelsResponse,
  UpdateLabelsResponseSchema,
} from "./validation";

export const itemsLabelsRouter = new Hono<EnvBindings>()
  .post(
    "/",
    describeRoute(
      apiDoc("post", UpdateLabelsRequestSchema, UpdateLabelsResponseSchema),
    ),
    zValidator(
      "json",
      UpdateLabelsRequestSchema,
      parseError<UpdateLabelsRequest, UpdateLabelsResponse>,
    ),
    async (c): Promise<APIResponse<UpdateLabelsResponse>> => {
      const userId = c.get("userId");
      try {
        const profileResult = await checkUserProfile(c, userId);
        if (profileResult.error) {
          return profileResult.error;
        }

        const { slugs, labelIds } = c.req.valid("json");
        if (!slugs || slugs.length === 0) {
          return c.json({ error: "No slugs provided." }, 400);
        }
        const db = getDb(c);

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
          return c.json({ error: "No valid labels provided." }, 404);
        }

        await db
          .insert(profileItemLabels)
          .values(insertValues)
          .onConflictDoNothing();

        const updatedSlugs = new Set(insertValues.map((v) => v.slug));

        const response = UpdateLabelsResponseSchema.parse({
          updated: Array.from(updatedSlugs).map((slug) => ({ slug })),
        });
        return c.json(response);
      } catch (error) {
        log("Error updating labels", { error });
        return c.json({ error: "Failed to update labels" }, 500);
      }
    },
  )
  .delete(
    "/",
    describeRoute(
      apiDoc(
        "delete",
        BulkDeleteLabelsRequestSchema,
        BulkDeleteLabelsResponseSchema,
      ),
    ),
    zValidator(
      "json",
      BulkDeleteLabelsRequestSchema,
      parseError<BulkDeleteLabelsRequest, BulkDeleteLabelsResponse>,
    ),
    async (c): Promise<APIResponse<BulkDeleteLabelsResponse>> => {
      const userId = c.get("userId");

      try {
        const profileResult = await checkUserProfile(c, userId);
        if (profileResult.error) {
          return profileResult.error;
        }

        const { slugs, labelIds } = c.req.valid("json");
        if (!slugs || slugs.length === 0) {
          return c.json({ error: "No slugs provided." }, 400);
        }

        const db = getDb(c);
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

        return c.json(response);
      } catch (error) {
        log("Error deleting labels", { error });
        return c.json({ error: "Failed to delete labels" }, 500);
      }
    },
  );
