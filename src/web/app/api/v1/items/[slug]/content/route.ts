import { and, db, eq } from "@/db";
import { items, profileItems } from "@/db/schema";
import {
  APIRequest,
  APIResponse,
  APIResponseJSON,
  checkUserProfile,
  parseAPIRequest,
} from "@/utils/api";
import { createLogger } from "@/utils/logger";
import {
  getItemContent,
  StorageError,
  uploadItemContent,
} from "@/utils/storage";

import {
  GetItemContentRequestSchema,
  GetItemContentResponse,
  UpdateItemContentRequestSchema,
  UpdateItemContentResponse,
  UploadStatus,
} from "./validation";

const log = createLogger("api/v1/items/[slug]/content");

export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetItemContentResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<GetItemContentResponse>;
    }

    const url = new URL(request.url);
    const data = await parseAPIRequest(
      GetItemContentRequestSchema,
      Object.fromEntries(url.searchParams),
    );
    if ("error" in data) {
      return data.error;
    }

    const { slug } = data;

    const item = await db
      .select()
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(
        and(
          eq(items.slug, slug),
          eq(profileItems.profileId, profileResult.profile.id),
        ),
      )
      .limit(1);

    if (!item.length) {
      return APIResponseJSON({ error: "Item not found." }, { status: 404 });
    }

    const content = await getItemContent(slug);
    const response: GetItemContentResponse = {
      content,
      itemId: item[0].items.id,
    };

    return APIResponseJSON(response);
  } catch (error) {
    log.error("Error getting item content:", error);
    return APIResponseJSON(
      { error: "Error getting item content." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateItemContentResponse>> {
  const userId = request.headers.get("x-user-id");
  try {
    const profileResult = await checkUserProfile(userId);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdateItemContentResponse>;
    }

    const body = await request.json();
    const data = await parseAPIRequest(UpdateItemContentRequestSchema, body);
    if ("error" in data) {
      return data.error;
    }

    const { slug, content } = data;

    const item = await db
      .select()
      .from(items)
      .innerJoin(profileItems, eq(items.id, profileItems.itemId))
      .where(
        and(
          eq(items.slug, slug),
          eq(profileItems.profileId, profileResult.profile.id),
        ),
      )
      .limit(1);

    if (!item.length) {
      return APIResponseJSON({ error: "Item not found." }, { status: 404 });
    }

    try {
      const status = await uploadItemContent(slug, content);

      const response: UpdateItemContentResponse = {
        status,
        itemId: item[0].items.id,
        message:
          status === UploadStatus.UPDATED_MAIN
            ? "Content updated and set as main version"
            : "Content updated",
      };

      return APIResponseJSON(response);
    } catch (error) {
      if (error instanceof StorageError) {
        return APIResponseJSON({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    log.error("Error updating item content:", error);
    return APIResponseJSON(
      { error: "Error updating item content." },
      { status: 500 },
    );
  }
}
