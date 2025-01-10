import { checkUserProfile } from "@/app/api/v1/items/utils";
import { and, db, eq } from "@/db";
import { items, profileItems } from "@/db/schema";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { createLogger } from "@/utils/logger";
import {
  getItemContent,
  StorageError,
  uploadItemContent,
} from "@/utils/storage";

import {
  GetItemContentResponse,
  ItemContentSchema,
  UpdateItemContentResponse,
  UploadStatus,
} from "./validation";

const log = createLogger("api/v1/items/[slug]/content");

export async function GET(
  request: APIRequest,
  { params }: { params: { slug: string } },
): Promise<APIResponse<GetItemContentResponse>> {
  try {
    const { slug } = params;
    const userId = request.headers.get("x-user-id");

    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    if (!slug) {
      return APIResponseJSON(
        { error: "Item slug is required." },
        { status: 400 },
      );
    }

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

    return APIResponseJSON({
      content,
      itemId: item[0].items.id,
    });
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
  { params }: { params: { slug: string } },
): Promise<APIResponse<UpdateItemContentResponse>> {
  try {
    const { slug } = params;
    const userId = request.headers.get("x-user-id");

    const profileResult = await checkUserProfile(userId);
    if (profileResult.error) {
      return profileResult.error;
    }

    if (!slug) {
      return APIResponseJSON(
        { error: "Item slug is required." },
        { status: 400 },
      );
    }

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

    const parsed = ItemContentSchema.safeParse(await request.json());

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => {
        const path =
          issue.path.length !== undefined ? issue.path.join(".") : issue.path;
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      const message = errors.join("\n");
      return APIResponseJSON(
        { error: `Invalid request body:\n${message}` },
        { status: 400 },
      );
    }

    try {
      const status = await uploadItemContent(slug, parsed.data.content);

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
