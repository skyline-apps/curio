import { LABELS_CLAUSE } from "@/app/api/v1/items/route";
import { and, db, eq, sql } from "@/db";
import { items, profileItemHighlights, profileItems } from "@/db/schema";
import { indexDocuments } from "@/lib/search";
import { storage } from "@/lib/storage";
import { StorageError } from "@/lib/storage/types";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  GetItemContentRequestSchema,
  GetItemContentResponse,
  GetItemContentResponseSchema,
  ItemResultWithHighlightsSchema,
} from "./validation";

const log = createLogger("api/v1/public/items/content");

async function getDefaultContent(
  slug: string,
): Promise<APIResponse<GetItemContentResponse>> {
  const itemResult = await db
    .select({
      id: items.id,
      url: items.url,
      slug: items.slug,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(eq(items.slug, slug))
    .limit(1);

  if (!itemResult.length) {
    return APIResponseJSON({ error: "Item not found." }, { status: 404 });
  }

  try {
    const { content } = await storage.getItemContent(slug, null);
    const metadata = await storage.getItemMetadata(slug);

    const response = GetItemContentResponseSchema.parse({
      content,
      item: {
        id: itemResult[0].id,
        slug: itemResult[0].slug,
        url: itemResult[0].url,
        createdAt: itemResult[0].createdAt,
        profileItemId: null,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          publishedAt: metadata.publishedAt,
          thumbnail: metadata.thumbnail,
          favicon: metadata.favicon,
          savedAt: metadata.timestamp,
        },
      },
    });

    return APIResponseJSON(response);
  } catch (error: unknown) {
    if (error instanceof StorageError) {
      return APIResponseJSON({
        item: {
          id: itemResult[0].id,
          slug: itemResult[0].slug,
          url: itemResult[0].url,
          createdAt: itemResult[0].createdAt,
        },
      });
    } else {
      throw error;
    }
  }
}

export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetItemContentResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");

  const url = new URL(request.url);
  const data = await parseAPIRequest(
    GetItemContentRequestSchema,
    Object.fromEntries(url.searchParams),
  );
  if ("error" in data) {
    return data.error;
  }

  const { slug } = data;

  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    const isAuthenticated = !("error" in profileResult);

    if (!isAuthenticated) {
      return getDefaultContent(slug);
    }

    const item = await db
      .select({
        id: items.id,
        url: items.url,
        slug: items.slug,
        profileItemId: profileItems.id,
        metadata: {
          title: profileItems.title,
          description: profileItems.description,
          author: profileItems.author,
          thumbnail: profileItems.thumbnail,
          favicon: profileItems.favicon,
          publishedAt: profileItems.publishedAt,
          savedAt: profileItems.savedAt,
          state: profileItems.state,
          isFavorite: profileItems.isFavorite,
          readingProgress: profileItems.readingProgress,
          lastReadAt: profileItems.lastReadAt,
          versionName: profileItems.versionName,
        },
        labels: LABELS_CLAUSE,
        highlights: sql<
          Array<{
            id: string;
            startOffset: number;
            endOffset: number;
            text: string | null;
            note: string | null;
          }>
        >`(
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', h.id,
                'startOffset', h.start_offset,
                'endOffset', h.end_offset,
                'text', h.text,
                'note', h.note
              ) ORDER BY h.start_offset
            ),
            '[]'::json
          )
          FROM ${profileItemHighlights} h
          WHERE h.profile_item_id = ${profileItems.id}
        )`,
        createdAt: items.createdAt,
      })
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
      return getDefaultContent(slug);
    }

    const itemResponse = ItemResultWithHighlightsSchema.parse(item[0]);

    try {
      const {
        version,
        versionName: retrievedVersionName,
        content,
      } = await storage.getItemContent(slug, itemResponse.metadata.versionName);

      let response: GetItemContentResponse = GetItemContentResponseSchema.parse(
        {
          content,
          item: itemResponse,
        },
      );
      // Clear out versionName if it can't be found.
      if (version !== itemResponse.metadata.versionName) {
        const updatedProfileItem = await db
          .update(profileItems)
          .set({ versionName: version })
          .where(
            and(
              eq(profileItems.itemId, itemResponse.id),
              eq(profileItems.profileId, profileResult.profile.id),
            ),
          )
          .returning({
            id: profileItems.id,
          });

        await indexDocuments([
          {
            profileItemId: updatedProfileItem[0].id,
            profileId: profileResult.profile.id,
            content: content,
            contentVersionName: retrievedVersionName,
          },
        ]);

        response = GetItemContentResponseSchema.parse({
          content,
          item: {
            ...itemResponse,
            metadata: { ...itemResponse.metadata, versionName: version },
          },
        });
      }
      return APIResponseJSON(response);
    } catch (error: unknown) {
      // Still return metadata if content can't be loaded
      if (error instanceof StorageError) {
        return APIResponseJSON({ item: itemResponse });
      } else {
        throw error;
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      log.error(`Error getting item content for ${slug}:`, error);
      return APIResponseJSON(
        { error: "Error getting item content." },
        { status: 500 },
      );
    } else {
      log.error(`Unknown error getting item content for ${slug}:`, error);
      return APIResponseJSON(
        { error: "Unknown error getting item content." },
        { status: 500 },
      );
    }
  }
}
