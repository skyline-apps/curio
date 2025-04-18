import { type TransactionDB } from "@app/api/db";
import { items } from "@app/api/db/schema";
import { cleanUrl, generateSlug } from "@app/api/utils/url";

export type DBItem = typeof items.$inferSelect;

export async function createOrUpdateItems(
  db: TransactionDB,
  itemUrls: string[],
): Promise<DBItem[]> {
  const cleanedUrls = Array.from(new Set(itemUrls.map((url) => cleanUrl(url))));

  const itemsToInsert = cleanedUrls.map((url) => ({
    url,
    slug: generateSlug(url),
  }));

  const insertedItems = await db
    .insert(items)
    .values(itemsToInsert)
    .onConflictDoUpdate({
      target: items.url,
      set: { slug: items.slug }, // Should be a no-op, needed to include the non-updated rows in the url to ID map
    })
    .returning({
      id: items.id,
      url: items.url,
      slug: items.slug,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
    });

  return insertedItems;
}
