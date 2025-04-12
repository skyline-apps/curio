import { eq, sql, TransactionDB } from "@app/api/db";
import { fetchOwnItemResults } from "@app/api/db/dal/profileItems";
import { items, profileItems } from "@app/api/db/schema";
import { getItemMetadata } from "@app/api/lib/storage";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings, EnvContext } from "@app/api/utils/env";
import {
  PersonalRecommendationType,
  RecommendationType,
} from "@app/schemas/db";
import {
  ItemResult,
  ItemResultSchema,
  PublicItemResult,
  PublicItemResultSchema,
} from "@app/schemas/v1/items";
import {
  GetRecommendationsRequest,
  GetRecommendationsRequestSchema,
  GetRecommendationsResponse,
  GetRecommendationsResponseSchema,
  RecommendationSection,
} from "@app/schemas/v1/items/recommended";
import { Hono } from "hono";

import {
  GlobalRecommendation,
  maybeUpdateAndGetGlobalRecommendations,
} from "./globalRecommendations";
import {
  maybeUpdateAndGetPersonalRecommendations,
  PersonalRecommendation,
} from "./personalRecommendations";

export const itemsRecommendedRouter = new Hono<EnvBindings>().get(
  "/",
  describeRoute(
    apiDoc(
      "get",
      GetRecommendationsRequestSchema,
      GetRecommendationsResponseSchema,
    ),
  ),
  zValidator(
    "query",
    GetRecommendationsRequestSchema,
    parseError<GetRecommendationsRequest, GetRecommendationsResponse>,
  ),
  async (c): Promise<APIResponse<GetRecommendationsResponse>> => {
    const log = c.get("log");
    const profileId = c.get("profileId")!;
    try {
      const allRecommendations: (
        | PersonalRecommendation
        | GlobalRecommendation
      )[] = [];
      const db = c.get("db");

      // Fetch stored recommendations from the database
      allRecommendations.push(
        ...(await maybeUpdateAndGetGlobalRecommendations(db, profileId)),
      );
      allRecommendations.push(
        ...(await maybeUpdateAndGetPersonalRecommendations(db, profileId)),
      );

      if (allRecommendations.length === 0) {
        return c.json(
          GetRecommendationsResponseSchema.parse({
            recommendations: [
              ...Object.values(RecommendationType).map((sectionType) => ({
                sectionType,
                items: [],
              })),
              ...Object.values(PersonalRecommendationType).map(
                (sectionType) => ({
                  sectionType,
                  items: [],
                }),
              ),
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

      const ownItemResults = await fetchItemResults(db, ownRecommendations);
      const publicItemResults = await fetchPublicItemResults(
        c,
        db,
        otherRecommendations.map((r) => r.itemId),
      );

      // Group recommendations by section
      const recommendationsBySection: Record<string, RecommendationSection> =
        {};
      for (const recType of [
        ...Object.values(RecommendationType),
        ...Object.values(PersonalRecommendationType),
      ]) {
        recommendationsBySection[recType] = {
          sectionType: recType,
          items: [],
        };
      }

      // Populate recommendation item metadata. If the recommendation came with a profileItemId, include
      // personal metadata
      for (const rec of allRecommendations) {
        const itemResult = ownItemResults.find((i) => i.id === rec.itemId);
        if (itemResult && rec.profileItemId) {
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

      return c.json(
        GetRecommendationsResponseSchema.parse({
          recommendations: Object.values(recommendationsBySection),
        }),
      );
    } catch (error) {
      log.error("Error fetching recommendations", { error, profileId });
      return c.json({ error: "Error fetching recommendations." }, 500);
    }
  },
);

async function fetchItemResults(
  db: TransactionDB,
  profileItemIds: string[],
): Promise<ItemResult[]> {
  if (profileItemIds.length === 0) return [];

  const ownItemResults = await fetchOwnItemResults(db).where(
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
  c: EnvContext,
  db: TransactionDB,
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
    const metadata = await getItemMetadata(c, itemResult.slug);
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
          textDirection: metadata.textDirection,
          textLanguage: metadata.textLanguage,
        },
      }),
    );
  }
  return results;
}
