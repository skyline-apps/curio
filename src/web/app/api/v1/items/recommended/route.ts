import {
  ItemResult,
  ItemResultSchema,
  PublicItemResult,
  PublicItemResultSchema,
} from "@/app/api/v1/items/validation";
import { and, db, desc, eq, exists, gt, isNull, not, or, sql } from "@/db";
import { fetchOwnItemResults } from "@/db/queries";
import {
  items,
  ItemState,
  profileItemRecommendations,
  profileItems,
  RecommendationSectionType,
} from "@/db/schema";
import { getItemMetadata } from "@/lib/storage";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  GetRecommendationsRequestSchema,
  GetRecommendationsResponse,
  GetRecommendationsResponseSchema,
  RecommendationSection,
} from "./validation";

const log = createLogger("api/v1/items/recommended");

export async function GET(
  request: APIRequest,
): Promise<APIResponse<GetRecommendationsResponse>> {
  const userId = request.headers.get("x-user-id");
  const apiKey = request.headers.get("x-api-key");
  try {
    const profileResult = await checkUserProfile(userId, apiKey);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<GetRecommendationsResponse>;
    }

    const url = new URL(request.url);
    const data = await parseAPIRequest(
      GetRecommendationsRequestSchema,
      Object.fromEntries(url.searchParams),
    );
    if ("error" in data) {
      return data.error;
    }

    // Fetch stored recommendations from the database
    const recommendationsFromDB = await fetchRecommendations(
      profileResult.profile.id,
    );

    // Check if recommendations need to be recomputed
    const shouldRecompute = await shouldRecomputeRecommendations(
      recommendationsFromDB,
    );

    if (shouldRecompute) {
      await computeAndStoreRecommendations(profileResult.profile.id);

      // Re-fetch recommendations after recomputing
      const freshRecommendations = await fetchRecommendations(
        profileResult.profile.id,
      );

      if (freshRecommendations.length === 0) {
        // Still no recommendations after recomputing
        return APIResponseJSON(
          GetRecommendationsResponseSchema.parse({
            recommendations: Object.values(RecommendationSectionType).map(
              (sectionType) => ({
                section: sectionType,
                items: [],
              }),
            ),
          }),
        );
      }

      // Use fresh recommendations
      recommendationsFromDB.length = 0;
      recommendationsFromDB.push(...freshRecommendations);
    }

    const ownRecommendations = recommendationsFromDB
      .map((r) => r.profileItemId)
      .filter((i) => i !== null);

    const otherRecommendations = recommendationsFromDB.filter(
      (r) => r.profileItemId === null,
    );

    const ownItemResults = await fetchItemResults(ownRecommendations);
    const publicItemResults = await fetchPublicItemResults(
      otherRecommendations.map((r) => r.itemId),
    );

    // Group recommendations by section
    const recommendationsBySection: Record<string, RecommendationSection> = {};
    for (const recType of Object.values(RecommendationSectionType)) {
      recommendationsBySection[recType] = {
        section: recType,
        items: [],
      };
    }
    for (const rec of recommendationsFromDB) {
      const itemResult = ownItemResults.find((i) => i.id === rec.itemId);
      if (itemResult) {
        recommendationsBySection[rec.sectionType].items.push(itemResult);
      } else {
        const publicItemResult = publicItemResults.find(
          (i) => i.id === rec.itemId,
        );
        if (publicItemResult) {
          recommendationsBySection[rec.sectionType].items.push(
            publicItemResult,
          );
        }
      }
    }

    return APIResponseJSON(
      GetRecommendationsResponseSchema.parse({
        recommendations: Object.values(recommendationsBySection),
      }),
    );
  } catch (error) {
    log.error("Error fetching recommendations:", error);
    return APIResponseJSON(
      { error: "Error fetching recommendations." },
      { status: 500 },
    );
  }
}

async function fetchItemResults(
  profileItemIds: string[],
): Promise<ItemResult[]> {
  if (profileItemIds.length === 0) return [];

  const ownItemResults = await fetchOwnItemResults().where(
    eq(
      profileItems.id,
      sql`ANY(ARRAY[${sql.join(profileItemIds, sql`, `)}]::uuid[])`,
    ),
  );

  return ownItemResults.map((item) => ItemResultSchema.parse(item));
}

// TODO: Consider storing default item metadata in the DB to prevent
// needing to fetch it from storage.
async function fetchPublicItemResults(
  itemIds: string[],
): Promise<PublicItemResult[]> {
  if (itemIds.length === 0) return [];
  const itemResults = await db
    .select({
      id: items.id,
      url: items.url,
      slug: items.slug,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(
      eq(items.id, sql`ANY(ARRAY[${sql.join(itemIds, sql`, `)}]::uuid[])`),
    );

  const results: PublicItemResult[] = [];

  for (const itemResult of itemResults) {
    const metadata = await getItemMetadata(itemResult.slug);
    results.push(
      PublicItemResultSchema.parse({
        id: itemResult.id,
        slug: itemResult.slug,
        url: itemResult.url,
        createdAt: itemResult.createdAt,
        profileItemId: null,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          publishedAt: metadata.publishedAt,
          thumbnail: metadata.thumbnail,
          favicon: metadata.favicon,
          savedAt: metadata.timestamp,
        },
      }),
    );
  }
  return results;
}

async function fetchRecommendations(profileId: string): Promise<
  {
    id: string;
    profileItemId: string | null;
    itemId: string;
    sectionType: RecommendationSectionType;
    createdAt: Date;
  }[]
> {
  const recommendations = await db
    .select({
      id: profileItemRecommendations.id,
      itemId: profileItemRecommendations.itemId,
      profileItemId: profileItemRecommendations.profileItemId,
      sectionType: profileItemRecommendations.sectionType,
      createdAt: profileItemRecommendations.createdAt,
    })
    .from(profileItemRecommendations)
    .where(eq(profileItemRecommendations.profileId, profileId))
    .orderBy(desc(profileItemRecommendations.createdAt));
  return recommendations;
}

async function shouldRecomputeRecommendations(
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

async function computeAndStoreRecommendations(
  profileId: string,
): Promise<void> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const recommendedItems: Record<
      RecommendationSectionType,
      { itemId: string; profileItemId: string | null }[]
    > = {
      [RecommendationSectionType.POPULAR]: [],
      [RecommendationSectionType.NEWSLETTER]: [],
      [RecommendationSectionType.FAVORITE_AUTHOR]: [],
      [RecommendationSectionType.FAVORITES]: [],
    };

    await db.transaction(async (tx) => {
      // Populate sections that may have public items
      const popularItemIds = tx
        .select({
          itemId: profileItems.itemId,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(profileItems)
        .where(
          and(
            not(eq(profileItems.state, ItemState.DELETED)),
            gt(profileItems.savedAt, oneWeekAgo),
          ),
        )
        .groupBy(profileItems.itemId)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(5)
        .as("popularItemIds");

      const popularItems = await tx
        .select({
          itemId: popularItemIds.itemId,
          profileItemId: profileItems.id,
        })
        .from(popularItemIds)
        .leftJoin(
          profileItems,
          and(
            eq(profileItems.itemId, popularItemIds.itemId),
            eq(profileItems.profileId, profileId),
          ),
        )
        .orderBy(desc(popularItemIds.count));

      recommendedItems[RecommendationSectionType.POPULAR] = popularItems.map(
        (item) => ({
          itemId: item.itemId,
          profileItemId: item.profileItemId as string | null,
        }),
      );

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
                // Be owned by me and unread
                and(
                  eq(profileItems.profileId, profileId),
                  isNull(profileItems.lastReadAt),
                ),
                // OR be owned by someone else AND not also read by me in another record
                and(
                  not(eq(profileItems.profileId, profileId)),
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

        recommendedItems[RecommendationSectionType.FAVORITE_AUTHOR].push({
          itemId: authorItems[0].itemId,
          profileItemId: authorItems[0].profileItemId as string | null,
        });
      }

      // Populate sections from user's own items
      // TODO: Populate from email newsletters
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

      recommendedItems[RecommendationSectionType.FAVORITES].push(
        ...favoriteItems.map((item) => ({
          itemId: item.itemId,
          profileItemId: item.profileItemId,
        })),
      );

      // Delete old recommendations
      await tx
        .delete(profileItemRecommendations)
        .where(eq(profileItemRecommendations.profileId, profileId));

      const recommendationsToInsert = Object.entries(recommendedItems).flatMap(
        ([sectionType, items]) =>
          items.map((item) => ({
            profileId,
            sectionType: sectionType as RecommendationSectionType,
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
              profileItemRecommendations.sectionType,
              profileItemRecommendations.itemId,
            ],
          });
      }
    });
  } catch (error) {
    log.error("Error computing recommendations:", error);
    throw error;
  }
}
