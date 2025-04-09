import { eq, type SQL, sql, type TransactionDB } from "@app/api/db";
import {
  items,
  profileItemHighlights,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@app/api/db/schema";
import { ExtractedMetadata } from "@app/api/lib/extract/types";
import { searchItemDocuments } from "@app/api/lib/search";
import { SearchError } from "@app/api/lib/search/types";
import { EnvContext } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { ItemSource, ItemState } from "@app/schemas/db";

export const LABELS_CLAUSE = sql<
  Array<{ id: string; name: string; color: string }>
>`COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', pl.id,
          'name', pl.name,
          'color', pl.color
        )
      )
      FROM ${profileItemLabels} pil
      INNER JOIN ${profileLabels} pl ON pl.id = pil.label_id
      WHERE pil.profile_item_id = ${profileItems.id}
    ),
    '[]'
  )::json
`;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function fetchOwnItemResults<T extends Record<string, SQL>>(
  db: TransactionDB,
  additionalFields: T = {} as T,
) {
  return db
    .select({
      id: items.id,
      url: items.url,
      slug: items.slug,
      createdAt: items.createdAt,
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
        source: profileItems.source,
        isFavorite: profileItems.isFavorite,
        readingProgress: profileItems.readingProgress,
        lastReadAt: profileItems.lastReadAt,
        versionName: profileItems.versionName,
        stateUpdatedAt: profileItems.stateUpdatedAt,
        textDirection: profileItems.textDirection,
        textLanguage: profileItems.textLanguage,
      },
      labels: LABELS_CLAUSE,
      ...additionalFields,
    })
    .from(items)
    .innerJoin(profileItems, eq(items.id, profileItems.itemId));
}

export async function getRelevantProfileItemIds(
  c: EnvContext,
  limit: number,
  offset: number,
  search?: string,
): Promise<
  | { success: false; searchResults: null; nextOffset: null; total: null }
  | {
      success: true;
      searchResults: { slug: string; excerpt: string }[];
      nextOffset: number | undefined;
      total: number;
    }
> {
  if (!search) {
    return {
      success: false,
      searchResults: null,
      nextOffset: null,
      total: null,
    };
  }
  try {
    const { hits, estimatedTotalHits } = await searchItemDocuments(c, search, {
      offset,
      limit,
    });

    const hasNextPage = estimatedTotalHits > offset + limit;
    const items = hits;
    const nextOffset = hasNextPage ? offset + limit : undefined;
    return {
      success: true,
      searchResults: items.map((item) => ({
        slug: item.slug,
        excerpt: item._formatted?.content || "",
      })),
      nextOffset,
      total: estimatedTotalHits,
    };
  } catch (error) {
    if (error instanceof SearchError) {
      log(
        `Failed to search items for ${search}, falling back to normal search: ${error.message}`,
      );
      return {
        success: false,
        searchResults: null,
        nextOffset: null,
        total: null,
      };
    }
    throw error;
  }
}

export interface UpdateOptions {
  source?: ItemSource;
  versionName?: string;
}

export async function updateProfileItem(
  tx: TransactionDB,
  itemUrl: string,
  profileId: string,
  itemId: string,
  metadata: ExtractedMetadata,
  savedAt: Date,
  options: UpdateOptions = {},
): Promise<string> {
  const { source } = options;
  const newTitle = metadata.title || itemUrl;
  const newItem = {
    profileId: profileId,
    itemId: itemId,
    savedAt: savedAt,
    title: newTitle,
    author: metadata.author,
    description: metadata.description,
    thumbnail: metadata.thumbnail,
    favicon: metadata.favicon,
    publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : null,
    textDirection: metadata.textDirection,
    readingProgress: 0,
    versionName: options.versionName || null,
    state: ItemState.ACTIVE,
    ...(source ? { source } : {}),
  };
  const profileItem = await tx
    .insert(profileItems)
    .values(newItem)
    .onConflictDoUpdate({
      target: [profileItems.itemId, profileItems.profileId],
      set: newItem,
    })
    .returning({
      id: profileItems.id,
    });

  if (!profileItem.length) {
    throw Error("Failed to save updated profile item information.");
  }
  // Delete previous highlights
  await tx
    .delete(profileItemHighlights)
    .where(
      eq(
        profileItemHighlights.profileItemId,
        sql`(SELECT id FROM ${profileItems} WHERE profile_id = ${profileId} AND id = ${profileItemHighlights.profileItemId} AND item_id = ${itemId})`,
      ),
    );

  return profileItem[0].id;
}
