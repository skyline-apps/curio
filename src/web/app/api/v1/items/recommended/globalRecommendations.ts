import { and, db, desc, eq, gt, inArray, not, sql } from "@/db";
import {
  itemRecommendations,
  ItemSource,
  ItemState,
  profileItems,
  RecommendationType,
} from "@/db/schema";
import { createLogger } from "@/utils/logger";

export type GlobalRecommendation = {
  id: string;
  profileItemId: string | null;
  itemId: string;
  type: RecommendationType;
  createdAt: Date;
};

const log = createLogger("api/v1/items/recommended");

export async function maybeUpdateAndGetGlobalRecommendations(
  profileId: string,
): Promise<GlobalRecommendation[]> {
  const recommendationsFromDB = await fetchGlobalRecommendations();

  // Check if recommendations need to be recomputed
  const shouldRecompute = await shouldRecomputeGlobalRecommendations(
    recommendationsFromDB,
  );

  if (shouldRecompute) {
    await computeAndStoreGlobalRecommendations();

    // Re-fetch recommendations after recomputing
    const freshRecommendations = await fetchGlobalRecommendations();

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

async function fetchGlobalRecommendations(): Promise<
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

async function computeAndStoreGlobalRecommendations(): Promise<void> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  try {
    log.info("Computing new global recommendations");
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
            not(eq(profileItems.source, ItemSource.EMAIL)),
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
    log.error(`Error computing global recommendations: ${error}`);
    throw error;
  }
}
