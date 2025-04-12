import { and, eq, sql } from "@app/api/db";
import { items, profileItems } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  UpdateFavoriteRequest,
  UpdateFavoriteRequestSchema,
  UpdateFavoriteResponse,
  UpdateFavoriteResponseSchema,
} from "@app/schemas/v1/items/favorite";
import { Hono } from "hono";

export const itemsFavoriteRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", UpdateFavoriteRequestSchema, UpdateFavoriteResponseSchema),
  ),
  zValidator(
    "json",
    UpdateFavoriteRequestSchema,
    parseError<UpdateFavoriteRequest, UpdateFavoriteResponse>,
  ),
  async (c): Promise<APIResponse<UpdateFavoriteResponse>> => {
    const log = c.get("log");
    const profileId = c.get("profileId")!;
    const { slugs, favorite } = c.req.valid("json");
    try {
      const db = c.get("db");
      if (!slugs || slugs.length === 0) {
        return c.json({ error: "No slugs provided." }, 400);
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
            eq(profileItems.profileId, profileId),
            sql`${items.slug} = ANY(ARRAY[${sql.join(slugs, sql`, `)}]::text[])`,
          ),
        )
        .returning({
          slug: items.slug,
        });

      const response: UpdateFavoriteResponse =
        UpdateFavoriteResponseSchema.parse({
          updated: updatedItems,
        });

      return c.json(response);
    } catch (error) {
      log.error("Error favoriting items", { error, profileId, slugs });
      return c.json({ error: "Error favoriting items." }, 500);
    }
  },
);
