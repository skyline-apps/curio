import {
  ItemResult,
  ItemResultSchema,
  PublicItemResult,
  PublicItemResultSchema,
} from "@/app/api/v1/items/validation";
import { db, eq, sql } from "@/db";
import { fetchOwnItemResults } from "@/db/queries";
import {
  items,
  PersonalRecommendationType,
  profileItems,
  RecommendationType,
} from "@/db/schema";
import { getItemMetadata } from "@/lib/storage";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile, parseAPIRequest } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";

import {
  GlobalRecommendation,
  maybeUpdateAndGetGlobalRecommendations,
} from "./globalRecommendations";
import {
  maybeUpdateAndGetPersonalRecommendations,
  PersonalRecommendation,
} from "./personalRecommendations";
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
  try {
    const profileResult = await checkUserProfile(userId);
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

    const allRecommendations: (
      | PersonalRecommendation
      | GlobalRecommendation
    )[] = [];

    // Fetch stored recommendations from the database
    allRecommendations.push(
      ...(await maybeUpdateAndGetGlobalRecommendations(
        profileResult.profile.id,
      )),
    );
    allRecommendations.push(
      ...(await maybeUpdateAndGetPersonalRecommendations(
        profileResult.profile.id,
      )),
    );

    if (allRecommendations.length === 0) {
      return APIResponseJSON(
        GetRecommendationsResponseSchema.parse({
          recommendations: [
            ...Object.values(RecommendationType).map((sectionType) => ({
              sectionType,
              items: [],
            })),
            ...Object.values(PersonalRecommendationType).map((sectionType) => ({
              sectionType,
              items: [],
            })),
          ],
        }),
      );
    }

    const ownRecommendations = allRecommendations
      .map((r) => r.profileItemId)
      .filter((i) => i !== null) as string[];

    const otherRecommendations = allRecommendations.filter(
      (r) => r.profileItemId === null,
    );

    const ownItemResults = await fetchItemResults(ownRecommendations);
    const publicItemResults = await fetchPublicItemResults(
      otherRecommendations.map((r) => r.itemId),
    );

    // Group recommendations by section
    const recommendationsBySection: Record<string, RecommendationSection> = {};
    for (const recType of [
      ...Object.values(RecommendationType),
      ...Object.values(PersonalRecommendationType),
    ]) {
      recommendationsBySection[recType] = {
        sectionType: recType,
        items: [],
      };
    }
    for (const rec of allRecommendations) {
      const itemResult = ownItemResults.find((i) => i.id === rec.itemId);
      if (itemResult) {
        recommendationsBySection[rec.type].items.push(itemResult);
      } else {
        const publicItemResult = publicItemResults.find(
          (i) => i.id === rec.itemId,
        );
        if (publicItemResult) {
          recommendationsBySection[rec.type].items.push(publicItemResult);
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
