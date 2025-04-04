import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  not,
  sql,
  TransactionDB,
} from "@api/db";
import {
  itemRecommendations,
  ItemState,
  profileItems,
  RecommendationType,
} from "@api/db/schema";
import log from "@api/utils/logger";

export type GlobalRecommendation = {
  id: string;
  profileItemId: string | null;
  itemId: string;
  type: RecommendationType;
  createdAt: Date;
};

// Returns items with profileItemId if they are already in the user's library.
export async function maybeUpdateAndGetGlobalRecommendations(
  db: TransactionDB,
  profileId: string,
): Promise<GlobalRecommendation[]> {
  const recommendationsFromDB = await fetchGlobalRecommendations(db);

  // Check if recommendations need to be recomputed
  const shouldRecompute = await shouldRecomputeGlobalRecommendations(
    db,
    recommendationsFromDB,
  );

  if (shouldRecompute) {
    await computeAndStoreGlobalRecommendations(db);

    // Re-fetch recommendations after recomputing
    const freshRecommendations = await fetchGlobalRecommendations(db);

    // Use fresh recommendations
    recommendationsFromDB.length = 0;
    recommendationsFromDB.push(...freshRecommendations);
  }

  const alreadySaved = await db
    .select({ profileItemId: profileItems.id, itemId: profileItems.itemId })
    .from(profileItems)
    .where(
      and(
        eq(profileItems.profileId, profileId),
        not(eq(profileItems.state, ItemState.DELETED)),
        inArray(
          profileItems.itemId,
          recommendationsFromDB.map((r) => r.itemId),
        ),
      ),
    );

  return recommendationsFromDB.map((r) => ({
    ...r,
    profileItemId:
      alreadySaved.find((s) => s.itemId === r.itemId)?.profileItemId || null,
  }));
}

async function fetchGlobalRecommendations(db: TransactionDB): Promise<
  {
    id: string;
    itemId: string;
    type: RecommendationType;
    createdAt: Date;
  }[]
> {
  return await db
    .select({
      id: itemRecommendations.id,
      itemId: itemRecommendations.itemId,
      type: itemRecommendations.type,
      createdAt: itemRecommendations.createdAt,
    })
    .from(itemRecommendations)
    .orderBy(desc(itemRecommendations.createdAt));
}

async function shouldRecomputeGlobalRecommendations(
  db: TransactionDB,
  existingRecommendations: Array<{
    itemId: string;
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
  return false;
}

async function computeAndStoreGlobalRecommendations(
  db: TransactionDB,
): Promise<void> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  try {
    log("Computing new global recommendations");
    const recommendedItems: Record<RecommendationType, { itemId: string }[]> = {
      [RecommendationType.POPULAR]: [],
    };
    await db.transaction(async (tx) => {
      const popularItemIds = await tx
        .select({
          itemId: profileItems.itemId,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(profileItems)
        .where(
          and(
            not(eq(profileItems.state, ItemState.DELETED)),
            gt(profileItems.savedAt, oneWeekAgo),
            isNull(profileItems.source),
            not(isNull(profileItems.thumbnail)),
          ),
        )
        .groupBy(profileItems.itemId)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(5);

      recommendedItems[RecommendationType.POPULAR] = popularItemIds.map(
        (item) => ({
          itemId: item.itemId,
        }),
      );
      const recommendationsToInsert = Object.entries(recommendedItems).flatMap(
        ([type, items]) =>
          items.map((item) => ({
            type: type as RecommendationType,
            itemId: item.itemId,
          })),
      );

      // Insert new recommendations if we have any
      if (recommendationsToInsert.length > 0) {
        await tx.delete(itemRecommendations);
        await tx
          .insert(itemRecommendations)
          .values(recommendationsToInsert)
          .onConflictDoNothing({
            target: [itemRecommendations.type, itemRecommendations.itemId],
          });
      }
    });
  } catch (error) {
    log(`Error computing global recommendations: ${error}`);
    throw error;
  }
}
