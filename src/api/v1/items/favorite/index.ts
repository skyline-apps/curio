import { and, eq, getDb, sql } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import { items, profileItems } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  UpdateFavoriteRequest,
  UpdateFavoriteRequestSchema,
  UpdateFavoriteResponse,
  UpdateFavoriteResponseSchema,
} from "./validation";

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
    const userId = c.get("userId");
    try {
      const profileResult = await checkUserProfile(c, userId);
      if (profileResult.error) {
        return profileResult.error;
      }

      const db = getDb(c);
      const { slugs, favorite } = c.req.valid("json");
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
            eq(profileItems.profileId, profileResult.profile.id),
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
      log("Error favoriting items:", error);
      return c.json({ error: "Error favoriting items." }, 500);
    }
  },
);
