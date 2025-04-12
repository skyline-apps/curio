import { and, eq, inArray, sql } from "@app/api/db";
import { items, profileItemLabels, profileItems } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  BulkDeleteLabelsRequest,
  BulkDeleteLabelsRequestSchema,
  BulkDeleteLabelsResponse,
  BulkDeleteLabelsResponseSchema,
  UpdateLabelsRequest,
  UpdateLabelsRequestSchema,
  UpdateLabelsResponse,
  UpdateLabelsResponseSchema,
} from "@app/schemas/v1/items/labels";
import { Hono } from "hono";

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
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      const { slugs, labelIds } = c.req.valid("json");
      try {
        if (!slugs || slugs.length === 0) {
          return c.json({ error: "No slugs provided." }, 400);
        }
        const db = c.get("db");

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
              eq(profileItems.profileId, profileId),
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
        log.error("Error updating labels", {
          error,
          slugs,
          labelIds,
          profileId,
        });
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
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      const { slugs, labelIds } = c.req.valid("json");

      try {
        if (!slugs || slugs.length === 0) {
          return c.json({ error: "No slugs provided." }, 400);
        }

        const db = c.get("db");
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
              eq(profileItems.profileId, profileId),
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
        log.error("Error deleting labels", {
          error,
          slugs,
          labelIds,
          profileId,
        });
        return c.json({ error: "Failed to delete labels" }, 500);
      }
    },
  );
