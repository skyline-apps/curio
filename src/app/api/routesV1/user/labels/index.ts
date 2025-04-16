import { and, eq, inArray } from "@app/api/db";
import { createOrUpdateLabels } from "@app/api/db/dal/userLabels";
import { checkDbError, DbError, DbErrorCode } from "@app/api/db/errors";
import { profileLabels } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
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
} from "@app/schemas/v1/user/labels";
import { Hono } from "hono";

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
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      try {
        const db = c.get("db");
        const labels = await db
          .select({
            id: profileLabels.id,
            name: profileLabels.name,
            color: profileLabels.color,
          })
          .from(profileLabels)
          .where(eq(profileLabels.profileId, profileId))
          .orderBy(profileLabels.createdAt);
        const response: GetLabelsResponse = GetLabelsResponseSchema.parse({
          labels,
        });
        return c.json(response);
      } catch (error) {
        log.error(`Error fetching labels for user`, { error, profileId });
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
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      try {
        const { labels } = c.req.valid("json");
        const db = c.get("db");
        const updatedLabels = await createOrUpdateLabels(db, profileId, labels);

        const response = CreateOrUpdateLabelsResponseSchema.parse({
          labels: updatedLabels,
        });
        return c.json(response);
      } catch (error) {
        if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
          return c.json({ error: "Label name already in use." }, 400);
        }
        log.error(`Error updating labels for user`, { profileId, error });
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
      const log = c.get("log");
      const profileId = c.get("profileId")!;
      try {
        const { ids } = c.req.valid("json");
        const db = c.get("db");
        const deleted = await db
          .delete(profileLabels)
          .where(
            and(
              inArray(profileLabels.id, ids),
              eq(profileLabels.profileId, profileId),
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
        log.error(`Error deleting labels for user`, { profileId, error });
        return c.json({ error: "Error deleting labels." }, 500);
      }
    },
  );
