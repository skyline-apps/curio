import { and, eq, getDb, inArray, sql } from "@api/db";
import { checkUserProfile } from "@api/db/dal/profile";
import { checkDbError, DbError, DbErrorCode } from "@api/db/errors";
import { profileLabels } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  CreateOrUpdateLabelsRequest,
  CreateOrUpdateLabelsRequestSchema,
  CreateOrUpdateLabelsResponse,
  CreateOrUpdateLabelsResponseSchema,
  DeleteLabelsRequest,
  DeleteLabelsRequestSchema,
  DeleteLabelsResponse,
  DeleteLabelsResponseSchema,
  GetLabelsRequest,
  GetLabelsRequestSchema,
  GetLabelsResponse,
  GetLabelsResponseSchema,
} from "./validation";

export const userLabelsRouter = new Hono<EnvBindings>()
  .get(
    "/",
    describeRoute(
      apiDoc("get", GetLabelsRequestSchema, GetLabelsResponseSchema),
    ),
    zValidator(
      "query",
      GetLabelsRequestSchema,
      parseError<GetLabelsRequest, GetLabelsResponse>,
    ),
    async (c): Promise<APIResponse<GetLabelsResponse>> => {
      const userId = c.get("userId");
      try {
        const profileResult = await checkUserProfile(c, userId);
        if ("error" in profileResult) {
          return profileResult.error as APIResponse<GetLabelsResponse>;
        }
        const db = getDb(c);
        const labels = await db
          .select({
            id: profileLabels.id,
            name: profileLabels.name,
            color: profileLabels.color,
          })
          .from(profileLabels)
          .where(eq(profileLabels.profileId, profileResult.profile.id))
          .orderBy(profileLabels.createdAt);
        const response: GetLabelsResponse = GetLabelsResponseSchema.parse({
          labels,
        });
        return c.json(response);
      } catch (error) {
        log(`Error fetching labels for user ${userId}`, error);
        return c.json({ error: "Error fetching labels." }, 500);
      }
    },
  )
  .post(
    "/",
    describeRoute(
      apiDoc(
        "post",
        CreateOrUpdateLabelsRequestSchema,
        CreateOrUpdateLabelsResponseSchema,
      ),
    ),
    zValidator(
      "json",
      CreateOrUpdateLabelsRequestSchema,
      parseError<CreateOrUpdateLabelsRequest, CreateOrUpdateLabelsResponse>,
    ),
    async (c): Promise<APIResponse<CreateOrUpdateLabelsResponse>> => {
      const userId = c.get("userId");
      try {
        const profileResult = await checkUserProfile(c, userId);
        if ("error" in profileResult) {
          return profileResult.error as APIResponse<CreateOrUpdateLabelsResponse>;
        }
        const { labels } = c.req.valid("json");
        const db = getDb(c);
        const now = new Date();
        const newLabels = labels.map((label) => ({
          id: "id" in label ? label.id : undefined,
          profileId: profileResult.profile.id,
          name: label.name ?? "",
          color: label.color ?? "",
          createdAt: now,
          updatedAt: now,
        }));
        const updatedLabels = await db
          .insert(profileLabels)
          .values(newLabels)
          .onConflictDoUpdate({
            target: [profileLabels.id],
            set: {
              name: sql`CASE WHEN EXCLUDED.name = '' THEN profile_labels.name ELSE EXCLUDED.name END`,
              color: sql`CASE WHEN EXCLUDED.color = '' THEN profile_labels.color ELSE EXCLUDED.color END`,
              updatedAt: sql`now()`,
            },
            where: eq(profileLabels.profileId, profileResult.profile.id),
          })
          .returning({
            id: profileLabels.id,
            name: profileLabels.name,
            color: profileLabels.color,
          });

        const response = CreateOrUpdateLabelsResponseSchema.parse({
          labels: updatedLabels,
        });
        return c.json(response);
      } catch (error) {
        if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
          return c.json({ error: "Label name already in use." }, 400);
        }
        log(`Error updating labels for user ${userId}`, error);
        return c.json({ error: "Error updating labels." }, 500);
      }
    },
  )
  .delete(
    "/",
    describeRoute(
      apiDoc("delete", DeleteLabelsRequestSchema, DeleteLabelsResponseSchema),
    ),
    zValidator(
      "json",
      DeleteLabelsRequestSchema,
      parseError<DeleteLabelsRequest, DeleteLabelsResponse>,
    ),
    async (c): Promise<APIResponse<DeleteLabelsResponse>> => {
      const userId = c.get("userId");
      try {
        const profileResult = await checkUserProfile(c, userId);
        if ("error" in profileResult) {
          return profileResult.error as APIResponse<DeleteLabelsResponse>;
        }
        const { ids } = c.req.valid("json");
        const db = getDb(c);
        const deleted = await db
          .delete(profileLabels)
          .where(
            and(
              inArray(profileLabels.id, ids),
              eq(profileLabels.profileId, profileResult.profile.id),
            ),
          )
          .returning({ deleted: profileLabels.id });
        if (deleted.length === 0) {
          return c.json({ error: "Labels not found." }, 404);
        }
        const response = DeleteLabelsResponseSchema.parse({
          deleted: deleted.length,
        });
        return c.json(response);
      } catch (error) {
        log(`Error deleting labels for user ${userId}`, error);
        return c.json({ error: "Error deleting labels." }, 500);
      }
    },
  );
