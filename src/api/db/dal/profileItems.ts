import { eq, type SQL, sql, type TransactionDB } from "@api/db";
import {
  items,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@api/db/schema";
import { searchItemDocuments } from "@api/lib/search";
import { SearchError } from "@api/lib/search/types";
import { EnvContext } from "@api/utils/env";
import log from "@api/utils/logger";

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
