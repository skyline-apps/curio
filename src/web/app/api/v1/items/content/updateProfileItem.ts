import { eq, sql, type TransactionDB } from "@/db";
import {
  ItemSource,
  profileItemHighlights,
  profileItems,
  TextDirection,
} from "@/db/schema";
import { ExtractedMetadata } from "@/lib/extract/types";

export interface ExportOptions {
  textDirection?: TextDirection;
  source?: ItemSource;
}

export async function updateProfileItem(
  tx: TransactionDB,
  itemUrl: string,
  profileId: string,
  itemId: string,
  metadata: ExtractedMetadata,
  savedAt: Date,
  options: ExportOptions,
): Promise<string> {
  const { textDirection, source } = options;
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
    readingProgress: 0,
    versionName: null,
    ...(source ? { source } : {}),
    ...(textDirection ? { textDirection } : {}),
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
