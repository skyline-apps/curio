import {
  and,
  desc,
  eq,
  exists,
  isNull,
  not,
  or,
  sql,
  TransactionDB,
} from "@api/db";
import {
  items,
  ItemSource,
  ItemState,
  PersonalRecommendationType,
  profileItemRecommendations,
  profileItems,
} from "@api/db/schema";
import log from "@api/utils/logger";

export type PersonalRecommendation = {
  id: string;
  profileItemId: string | null;
  itemId: string;
  type: PersonalRecommendationType;
  createdAt: Date;
};

export async function maybeUpdateAndGetPersonalRecommendations(
  db: TransactionDB,
  profileId: string,
): Promise<PersonalRecommendation[]> {
  const recommendationsFromDB = await fetchPersonalRecommendations(
    db,
    profileId,
  );

  // Check if recommendations need to be recomputed
  const shouldRecompute = await shouldRecomputePersonalRecommendations(
    db,
    recommendationsFromDB,
  );

  if (shouldRecompute) {
    await computeAndStorePersonalRecommendations(db, profileId);

    // Re-fetch recommendations after recomputing
    const freshRecommendations = await fetchPersonalRecommendations(
      db,
      profileId,
    );

    // Use fresh recommendations
    recommendationsFromDB.length = 0;
    recommendationsFromDB.push(...freshRecommendations);
  }

  return recommendationsFromDB;
}

async function fetchPersonalRecommendations(
  db: TransactionDB,
  profileId: string,
): Promise<PersonalRecommendation[]> {
  const recommendations = await db
    .select({
      id: profileItemRecommendations.id,
      itemId: profileItemRecommendations.itemId,
      profileItemId: profileItemRecommendations.profileItemId,
      type: profileItemRecommendations.type,
      createdAt: profileItemRecommendations.createdAt,
    })
    .from(profileItemRecommendations)
    .where(eq(profileItemRecommendations.profileId, profileId))
    .orderBy(desc(profileItemRecommendations.createdAt));
  return recommendations;
}

async function shouldRecomputePersonalRecommendations(
  db: TransactionDB,
  existingRecommendations: Array<{
    itemId: string;
    profileItemId: string | null;
    createdAt: Date;
  }>,
): Promise<boolean> {
  if (existingRecommendations.length === 0) {
    return true;
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oldestRecommendation = existingRecommendations.reduce(
    (oldest, current) =>
      current.createdAt < oldest ? current.createdAt : oldest,
    existingRecommendations[0].createdAt,
  );

  if (oldestRecommendation < oneWeekAgo) {
    return true;
  }

  const profileItemIds = existingRecommendations
    .filter((rec) => rec.profileItemId !== null)
    .map((rec) => rec.profileItemId as string);

  if (profileItemIds.length === 0) {
    return false;
  }

  const readItems = await db
    .select({ count: sql<number>`count(*)` })
    .from(profileItems)
    .where(
      and(
        sql`${profileItems.id} = ANY(ARRAY[${sql.join(
          profileItemIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )}])`,
        sql`${profileItems.lastReadAt} IS NOT NULL`,
      ),
    );

  const readCount = Number(readItems[0]?.count || 0);
  const readPercentage = (readCount / profileItemIds.length) * 100;

  return readPercentage > 60;
}

async function computeAndStorePersonalRecommendations(
  db: TransactionDB,
  profileId: string,
): Promise<void> {
  try {
    const recommendedItems: Record<
      PersonalRecommendationType,
      { itemId: string; profileItemId: string | null }[]
    > = {
      [PersonalRecommendationType.NEWSLETTER]: [],
      [PersonalRecommendationType.FAVORITE_AUTHOR]: [],
      [PersonalRecommendationType.FAVORITES]: [],
    };

    await db.transaction(async (tx) => {
      const favoriteAuthors = await tx
        .select({
          author: profileItems.author,
          count: sql<number>`count(*)`,
        })
        .from(profileItems)
        .where(
          and(
            eq(profileItems.profileId, profileId),
            not(eq(profileItems.state, ItemState.DELETED)),
            sql`${profileItems.author} IS NOT NULL`,
          ),
        )
        .groupBy(profileItems.author)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(5);

      for (const { author } of favoriteAuthors) {
        if (!author) continue;

        const authorItemId = tx
          .select({
            itemId: items.id,
          })
          .from(items)
          .innerJoin(profileItems, eq(items.id, profileItems.itemId))
          .where(
            and(
              eq(profileItems.author, author),
              // The item must either:
              or(
                // Be owned by me, unread, has an image, and not deleted
                and(
                  eq(profileItems.profileId, profileId),
                  not(eq(profileItems.state, ItemState.DELETED)),
                  isNull(profileItems.lastReadAt),
                  not(isNull(profileItems.thumbnail)),
                ),
                // OR be owned by someone else AND not also read by me in another record
                and(
                  not(eq(profileItems.profileId, profileId)),
                  not(isNull(profileItems.thumbnail)),
                  not(
                    exists(
                      tx
                        .select()
                        .from(profileItems)
                        .where(
                          and(
                            eq(profileItems.itemId, items.id),
                            eq(profileItems.profileId, profileId),
                            not(isNull(profileItems.lastReadAt)),
                          ),
                        ),
                    ),
                  ),
                ),
              ),
            ),
          )
          .orderBy(desc(profileItems.savedAt))
          .limit(1)
          .as("authorItemId");

        const authorItems = await tx
          .select({
            itemId: authorItemId.itemId,
            profileItemId: profileItems.id,
          })
          .from(authorItemId)
          .leftJoin(
            profileItems,
            and(
              eq(profileItems.itemId, authorItemId.itemId),
              eq(profileItems.profileId, profileId),
            ),
          );

        if (!authorItems.length) continue;

        recommendedItems[PersonalRecommendationType.FAVORITE_AUTHOR].push({
          itemId: authorItems[0].itemId,
          profileItemId: authorItems[0].profileItemId as string | null,
        });
      }

      // Populate sections from user's own items
      const newsletterItems = await tx
        .select({
          itemId: profileItems.itemId,
          profileItemId: profileItems.id,
        })
        .from(profileItems)
        .where(
          and(
            eq(profileItems.profileId, profileId),
            eq(profileItems.state, ItemState.ACTIVE),
            eq(profileItems.source, ItemSource.EMAIL),
            isNull(profileItems.lastReadAt),
          ),
        )
        .orderBy(desc(profileItems.savedAt))
        .limit(5);
      recommendedItems[PersonalRecommendationType.NEWSLETTER].push(
        ...newsletterItems,
      );

      const favoriteItems = await tx
        .select({
          itemId: profileItems.itemId,
          profileItemId: profileItems.id,
        })
        .from(profileItems)
        .where(
          and(
            eq(profileItems.profileId, profileId),
            eq(profileItems.isFavorite, true),
            not(eq(profileItems.state, ItemState.DELETED)),
          ),
        )
        .orderBy(sql`RANDOM()`)
        .limit(5);

      recommendedItems[PersonalRecommendationType.FAVORITES].push(
        ...favoriteItems,
      );

      // Delete old recommendations
      await tx
        .delete(profileItemRecommendations)
        .where(eq(profileItemRecommendations.profileId, profileId));

      const recommendationsToInsert = Object.entries(recommendedItems).flatMap(
        ([type, items]) =>
          items.map((item) => ({
            profileId,
            type: type as PersonalRecommendationType,
            itemId: item.itemId,
            profileItemId: item.profileItemId,
          })),
      );

      // Insert new recommendations if we have any
      if (recommendationsToInsert.length > 0) {
        await tx
          .insert(profileItemRecommendations)
          .values(recommendationsToInsert)
          .onConflictDoNothing({
            target: [
              profileItemRecommendations.profileId,
              profileItemRecommendations.type,
              profileItemRecommendations.itemId,
            ],
          });
      }
    });
  } catch (error) {
    log(`Error computing personal recommendations for ${profileId}: ${error}`);
    throw error;
  }
}
