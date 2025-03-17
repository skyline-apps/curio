import { db, eq, type SQL, sql } from "@/db";
import {
  items,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@/db/schema";

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
