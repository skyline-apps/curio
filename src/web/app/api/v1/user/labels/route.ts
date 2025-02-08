import { and, db, eq, inArray, sql } from "@/db";
import { profileLabels } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  CreateOrUpdateLabelsRequestSchema,
  CreateOrUpdateLabelsResponse,
  CreateOrUpdateLabelsResponseSchema,
  DeleteLabelsRequestSchema,
  DeleteLabelsResponse,
  DeleteLabelsResponseSchema,
  GetLabelsResponse,
  GetLabelsResponseSchema,
} from "./validation";

const log = createLogger("api/v1/user/labels");

/** @no-request */
export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetLabelsResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<GetLabelsResponse>;
    }
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
    return APIResponseJSON(response);
  } catch (error) {
    log.error(`Error fetching labels for user ${userId}`, error);
    return APIResponseJSON(
      { error: "Error fetching labels." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: APIRequest,
): Promise<APIResponse<CreateOrUpdateLabelsResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<CreateOrUpdateLabelsResponse>;
    }
    const body = await request.json();
    const data = await parseAPIRequest(CreateOrUpdateLabelsRequestSchema, body);

    if ("error" in data) {
      return data.error;
    }
    const now = new Date();
    const newLabels = data.labels.map((label) => ({
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
    return APIResponseJSON(response);
  } catch (error) {
    log.error(`Error updating labels for user ${userId}`, error);
    return APIResponseJSON(
      { error: "Error updating labels." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: APIRequest,
): Promise<APIResponse<DeleteLabelsResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<DeleteLabelsResponse>;
    }
    const body = await request.json();
    const data = await parseAPIRequest(DeleteLabelsRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }
    const deleted = await db
      .delete(profileLabels)
      .where(
        and(
          inArray(profileLabels.id, data.ids),
          eq(profileLabels.profileId, profileResult.profile.id),
        ),
      )
      .returning({ deleted: profileLabels.id });
    if (deleted.length === 0) {
      return APIResponseJSON({ error: "Labels not found." }, { status: 404 });
    }
    const response = DeleteLabelsResponseSchema.parse({
      deleted: deleted.length,
    });
    return APIResponseJSON(response);
  } catch (error) {
    log.error(`Error deleting labels for user ${userId}`, error);
    return APIResponseJSON(
      { error: "Error deleting labels." },
      { status: 500 },
    );
  }
}
