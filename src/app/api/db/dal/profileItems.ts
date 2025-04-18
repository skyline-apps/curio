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
import { cleanUrl } from "@app/api/utils/url";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { ItemMetadataUpdate } from "@app/schemas/v1/items";

import { DBItem } from "./items";

export type DBProfileItem = typeof profileItems.$inferSelect;

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
  const log = c.get("log");
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
      log.warn(`Failed to search items, falling back to normal search`, {
        search,
        error,
      });
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

export async function createOrUpdateProfileItems(
  tx: TransactionDB,
  profileId: string,
  createdItems: DBItem[],
  newProfileItems: {
    url: string;
    metadata?: ItemMetadataUpdate;
    labelIds?: string[];
  }[],
): Promise<Partial<DBProfileItem>[]> {
  const urlToItemId = new Map(createdItems.map((item) => [item.url, item.id]));

  const itemIds = createdItems.map((item) => item.id);

  const stateUpdatedAtSet = new Set<string>();
  const deduplicatedProfileItems = new Map(
    newProfileItems.map((item) => [cleanUrl(item.url), item]),
  );

  const profileItemsToInsert = Array.from(
    deduplicatedProfileItems.entries(),
  ).map(([cleanedUrl, item]) => {
    const itemId = urlToItemId.get(cleanedUrl);
    if (!itemId) {
      throw new Error(
        `Failed to find itemId for URL ${item.url}. This should never happen.`,
      );
    }
    const itemIndex = itemIds.indexOf(itemId);

    // Calculate stateUpdatedAt value
    let stateUpdatedAt = item.metadata?.stateUpdatedAt
      ? new Date(item.metadata?.stateUpdatedAt)
      : new Date(new Date().getTime() + itemIndex);

    // Check for duplicate stateUpdatedAt values
    const stateUpdatedAtStr = stateUpdatedAt.toISOString();
    if (stateUpdatedAtSet.has(stateUpdatedAtStr)) {
      stateUpdatedAt = new Date(stateUpdatedAt.getTime() + 1);
    }
    stateUpdatedAtSet.add(stateUpdatedAtStr);

    return {
      title: item.metadata?.title || cleanedUrl,
      description: item.metadata?.description || sql`NULL`,
      author: item.metadata?.author || sql`NULL`,
      thumbnail: item.metadata?.thumbnail || sql`NULL`,
      favicon: item.metadata?.favicon || sql`NULL`,
      textDirection: item.metadata?.textDirection || TextDirection.LTR,
      textLanguage: item.metadata?.textLanguage || "",
      source: item.metadata?.source || sql`NULL`,
      sourceMetadata: item.metadata?.sourceMetadata || sql`NULL`,
      publishedAt: item.metadata?.publishedAt
        ? new Date(item.metadata.publishedAt)
        : sql`NULL`,
      updatedAt: new Date(),
      profileId,
      state: item.metadata?.state || ItemState.ACTIVE,
      stateUpdatedAt,
      itemId,
      isFavorite: item.metadata?.isFavorite,
      readingProgress: item.metadata?.readingProgress || 0,
      lastReadAt: item.metadata?.lastReadAt
        ? new Date(item.metadata.lastReadAt)
        : null,
    };
  });

  const insertedMetadata = await tx
    .insert(profileItems)
    .values(profileItemsToInsert)
    .onConflictDoUpdate({
      target: [profileItems.profileId, profileItems.itemId],
      set: {
        title: sql`CASE
              WHEN EXCLUDED.title = (SELECT url FROM items WHERE id = profile_items.item_id) THEN COALESCE(profile_items.title, EXCLUDED.title)
              ELSE EXCLUDED.title
            END`,
        description: sql`COALESCE(EXCLUDED.description, ${profileItems.description})`,
        author: sql`COALESCE(EXCLUDED.author, ${profileItems.author})`,
        thumbnail: sql`COALESCE(EXCLUDED.thumbnail, ${profileItems.thumbnail})`,
        favicon: sql`COALESCE(EXCLUDED.favicon, ${profileItems.favicon})`,
        textDirection: sql`COALESCE(EXCLUDED.text_direction, ${profileItems.textDirection})`,
        textLanguage: sql`COALESCE(EXCLUDED.text_language, ${profileItems.textLanguage})`,
        source: sql`COALESCE(EXCLUDED.source, ${profileItems.source})`,
        sourceMetadata: sql`COALESCE(EXCLUDED.source_metadata, ${profileItems.sourceMetadata})`,
        publishedAt: sql`COALESCE(EXCLUDED.published_at, ${profileItems.publishedAt})`,
        stateUpdatedAt: sql`CASE
              WHEN EXCLUDED.state <> profile_items.state
              THEN EXCLUDED.state_updated_at
              ELSE profile_items.state_updated_at
            END`,
        updatedAt: sql`now()`,
        state: sql`EXCLUDED.state`,
        isFavorite: sql`(${profileItems.isFavorite} OR EXCLUDED.is_favorite)`,
      },
    })
    .returning({
      id: profileItems.id,
      itemId: profileItems.itemId,
      title: profileItems.title,
      description: profileItems.description,
      author: profileItems.author,
      thumbnail: profileItems.thumbnail,
      favicon: profileItems.favicon,
      textDirection: profileItems.textDirection,
      textLanguage: profileItems.textLanguage,
      publishedAt: profileItems.publishedAt,
      savedAt: profileItems.savedAt,
      state: profileItems.state,
      source: profileItems.source,
      sourceMetadata: profileItems.sourceMetadata,
      isFavorite: profileItems.isFavorite,
      readingProgress: profileItems.readingProgress,
      lastReadAt: profileItems.lastReadAt,
      versionName: profileItems.versionName,
    });

  const newProfileItemLabels = newProfileItems
    .map((item) => {
      if (item.labelIds) {
        const cleanedUrl = cleanUrl(item.url);
        const itemId = urlToItemId.get(cleanedUrl);
        if (!itemId) {
          throw new Error(
            `Failed to find itemId for URL ${item.url}. This should never happen.`,
          );
        }
        const labels = item.labelIds.map((labelId) => ({
          profileItemId: insertedMetadata.find((i) => i.itemId === itemId)!.id,
          labelId,
        }));
        return labels;
      }
      return [];
    })
    .flat();

  if (newProfileItemLabels.length > 0) {
    await tx
      .insert(profileItemLabels)
      .values(newProfileItemLabels)
      .onConflictDoNothing();
  }

  return insertedMetadata;
}
