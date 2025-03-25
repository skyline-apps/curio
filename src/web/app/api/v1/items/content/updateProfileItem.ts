import { eq, sql, type TransactionDB } from "@web/db";
import {
  ItemSource,
  ItemState,
  profileItemHighlights,
  profileItems,
} from "@web/db/schema";
import { ExtractedMetadata } from "@web/lib/extract/types";

export interface ExportOptions {
  source?: ItemSource;
}

export async function updateProfileItem(
  tx: TransactionDB,
  itemUrl: string,
  profileId: string,
  itemId: string,
  metadata: ExtractedMetadata,
  savedAt: Date,
  options: ExportOptions = {},
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
    versionName: null,
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
