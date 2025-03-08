import { v4 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";

import { ItemResult, PublicItemResult } from "@/app/api/v1/items/validation";
import { and, db, eq, sql } from "@/db";
import {
  itemRecommendations,
  items,
  PersonalRecommendationType,
  profileItemRecommendations,
  profileItems,
  profiles,
  RecommendationType,
} from "@/db/schema";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  DEFAULT_TEST_USER_ID_2,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  NONEXISTENT_USER_ID,
} from "@/utils/test/data";
import { testDb } from "@/utils/test/provider";

import { GET } from "./route";
import {
  GetRecommendationsResponseSchema,
  RecommendationSection,
} from "./validation";

describe("GET /api/v1/items/recommended", () => {
  describe("using default test data", () => {
    const recentItem = {
      id: "123e4567-e89b-12d3-a456-426614199999",
      profileId: DEFAULT_TEST_PROFILE_ID_2,
      itemId: MOCK_ITEMS[0].id,
      title: "recent item",
      savedAt: new Date(),
    };
    beforeEach(async () => {
      await db.insert(items).values(MOCK_ITEMS);
      await db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    });

    it("should return recommendations for a user with private pre-existing recommendations", async () => {
      await db.insert(itemRecommendations).values([
        {
          itemId: MOCK_ITEMS[0].id,
          type: RecommendationType.POPULAR,
          createdAt: new Date(),
        },
      ]);
      await db.insert(profileItemRecommendations).values([
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          itemId: MOCK_ITEMS[1].id,
          profileItemId: MOCK_PROFILE_ITEMS[1].id,
          type: PersonalRecommendationType.FAVORITES,
          createdAt: new Date(),
        },
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          itemId: MOCK_ITEMS[3].id,
          profileItemId: MOCK_PROFILE_ITEMS[3].id,
          type: PersonalRecommendationType.FAVORITE_AUTHOR,
          createdAt: new Date(),
        },
      ]);

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const { recommendations } = await response.json();
      expect(recommendations.length).toBe(4);

      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );
      expect(popularSection.items).toHaveLength(1);
      expect(popularSection.items[0].id).toBe(MOCK_ITEMS[0].id);
      expect(popularSection.items[0].profileItemId).toBe(
        MOCK_PROFILE_ITEMS[0].id,
      );

      const favoritesSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITES,
      );
      expect(favoritesSection).toBeDefined();
      expect(favoritesSection?.items.length).toBe(1);
      expect(favoritesSection?.items[0].id).toBe(MOCK_ITEMS[1].id);
      expect(favoritesSection?.items[0].profileItemId).toBe(
        MOCK_PROFILE_ITEMS[1].id,
      );
      expect(favoritesSection?.items[0].url).toBe(MOCK_ITEMS[1].url);
      expect(favoritesSection?.items[0].metadata.title).toBe(
        MOCK_PROFILE_ITEMS[1].title,
      );
      expect(favoritesSection?.items[0].metadata.author).toBe(
        MOCK_PROFILE_ITEMS[1].author,
      );
      expect(favoritesSection?.items[0].metadata.description).toBe(
        MOCK_PROFILE_ITEMS[1].description,
      );
      expect(favoritesSection?.items[0].metadata.isFavorite).toBe(true);

      const authorSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITE_AUTHOR,
      );
      expect(authorSection).toBeDefined();
      expect(authorSection?.items.length).toBe(1);
      expect(authorSection?.items[0].id).toBe(MOCK_ITEMS[3].id);
      expect(authorSection?.items[0].profileItemId).toBe(
        MOCK_PROFILE_ITEMS[3].id,
      );
      expect(authorSection?.items[0].metadata.author).toBe(
        MOCK_PROFILE_ITEMS[3].author,
      );

      const newsletterSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.NEWSLETTER,
      );
      expect(newsletterSection.items).toHaveLength(0);
    });

    it("should compute new recommendations for user with no existing recommendations", async () => {
      await db.insert(profileItems).values(recentItem);
      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      // Check that recommendations were created in the database
      const globalRecommendations = await db.select().from(itemRecommendations);
      expect(globalRecommendations.length).toBe(1);
      expect(globalRecommendations[0].itemId).toBe(MOCK_ITEMS[0].id);

      const storedRecommendations = await db
        .select()
        .from(profileItemRecommendations)
        .where(
          eq(profileItemRecommendations.profileId, DEFAULT_TEST_PROFILE_ID),
        );

      expect(storedRecommendations.length).toBe(2);

      // Verify response structure and content
      const json = await response.json();
      const { recommendations } = json;

      // Should include favorites section since we have favorite items
      const favoritesSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITES,
      );
      expect(favoritesSection?.items.length).toBe(1);
      expect(favoritesSection?.items[0].id).toBe(MOCK_ITEMS[1].id);
      expect(favoritesSection?.items[0].profileItemId).toBe(
        MOCK_PROFILE_ITEMS[1].id,
      );

      // Should include favorite author section with our author's items
      const authorItems = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITE_AUTHOR,
      );
      expect(authorItems?.items.length).toBe(1);
      expect(authorItems?.items[0].id).toBe(MOCK_ITEMS[3].id);
      expect(authorItems?.items[0].profileItemId).toBe(
        MOCK_PROFILE_ITEMS[3].id,
      );
      expect(authorItems?.items[0].metadata.author).toBe(
        MOCK_PROFILE_ITEMS[3].author,
      );
    });

    it("should recompute global recommendations if they are over a week old", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);

      await db.insert(profileItems).values(recentItem);
      await db.insert(itemRecommendations).values({
        itemId: MOCK_ITEMS[3].id,
        type: RecommendationType.POPULAR,
        createdAt: oldDate,
      });

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });

      const response = await GET(request);
      const { recommendations } = await response.json();

      const globalRecommendations = await db.select().from(itemRecommendations);
      expect(globalRecommendations.length).toBe(1);
      expect(globalRecommendations[0].itemId).toBe(MOCK_ITEMS[0].id);
      expect(globalRecommendations[0].createdAt.getTime()).toBeGreaterThan(
        oldDate.getTime(),
      );

      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );
      expect(popularSection?.items.length).toBe(1);
      expect(popularSection?.items[0].id).toBe(MOCK_ITEMS[0].id);
      expect(popularSection?.items[0].profileItemId).toBe(
        MOCK_PROFILE_ITEMS[0].id,
      );
    });

    it("should recompute personal recommendations if they are over a week old", async () => {
      // Insert a test recommendation that's over a week old
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      await db.insert(itemRecommendations).values({
        itemId: MOCK_ITEMS[0].id,
        type: RecommendationType.POPULAR,
        createdAt: new Date(),
      });

      await db.insert(profileItemRecommendations).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: MOCK_ITEMS[1].id,
        profileItemId: MOCK_PROFILE_ITEMS[1].id,
        type: PersonalRecommendationType.FAVORITES,
        createdAt: oldDate,
      });

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });

      const response = await GET(request);
      const { recommendations } = await response.json();

      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );

      expect(popularSection).toBeDefined();
      expect(popularSection?.items.length).toBe(1);
      expect(popularSection?.items[0].id).toBe(MOCK_ITEMS[0].id);

      // Check that the old recommendation was replaced with fresh ones
      const storedRecommendations = await db
        .select()
        .from(profileItemRecommendations)
        .where(
          eq(profileItemRecommendations.profileId, DEFAULT_TEST_PROFILE_ID),
        );

      const oldestRecommendation = storedRecommendations.reduce(
        (oldest, current) =>
          current.createdAt < oldest.createdAt ? current : oldest,
        storedRecommendations[0],
      );

      // Should have been created recently, not using the old date
      expect(oldestRecommendation.createdAt.getTime()).toBeGreaterThan(
        oldDate.getTime(),
      );

      // Should have more than just the old recommendation
      expect(storedRecommendations.length).toBeGreaterThan(1);
    });

    it("should recompute recommendations if most items have been read", async () => {
      // Insert a test recommendation
      await db.insert(profileItemRecommendations).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: MOCK_ITEMS[1].id,
        profileItemId: MOCK_PROFILE_ITEMS[1].id,
        type: PersonalRecommendationType.FAVORITES,
        createdAt: new Date(),
      });

      // Mark the item as read
      await db
        .update(profileItems)
        .set({
          lastReadAt: new Date(),
          readingProgress: 100,
        })
        .where(eq(profileItems.id, MOCK_PROFILE_ITEMS[1].id));

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });

      await GET(request);

      // Check that recommendations were recomputed
      const storedRecommendations = await db
        .select()
        .from(profileItemRecommendations)
        .where(
          eq(profileItemRecommendations.profileId, DEFAULT_TEST_PROFILE_ID),
        );

      // There should still be recommendations for this user
      expect(storedRecommendations.length).toBeGreaterThan(1);

      // There should be more than just the one read item as a recommendation
      expect(
        storedRecommendations.some((r) => r.itemId !== MOCK_ITEMS[1].id),
      ).toBe(true);
    });
  });

  describe("using generated test data", () => {
    const thisWeek = new Date();
    const lastWeek = new Date(thisWeek.getTime() - 8 * 24 * 60 * 60 * 1000);
    const userIds = new Array(2).fill(0).map((_) => v4());

    const mockProfiles = new Array(2).fill(0).map((_, i) => ({
      id: v4(),
      userId: userIds[i],
      username: `user${i}`,
    }));

    const mockItems = new Array(8).fill(0).map((_, i) => ({
      id: v4(),
      url: `https://example.com/${i}`,
      slug: `example-com-${i}`,
    }));

    const mockProfileItems = [
      ...mockItems.map((item, i) => ({
        id: v4(),
        itemId: item.id,
        title: `Example ${i}`,
        description: `Description for example ${i}`,
        author: `Author ${i % 4}`,
        thumbnail: `https://example.com/thumb${i}.jpg`,
        favicon: `https://example.com/favicon${i}.ico`,
        profileId: DEFAULT_TEST_PROFILE_ID,
        isFavorite: i % 2 === 0,
        lastReadAt: i % 2 === 1 ? new Date() : null,
        savedAt: i % 4 === 0 ? thisWeek : lastWeek,
      })),
      ...mockItems.slice(0, 5).map((item, i) => ({
        id: v4(),
        itemId: item.id,
        title: `Example ${i}`,
        description: `Description for example ${i}`,
        author: `Author ${i % 4}`,
        thumbnail: `https://example.com/thumb${i}.jpg`,
        favicon: `https://example.com/favicon${i}.ico`,
        profileId: mockProfiles[0].id,
        savedAt: i % 2 === 0 ? thisWeek : lastWeek,
      })),
      ...mockItems.slice(0, 5).map((item, i) => ({
        id: v4(),
        itemId: item.id,
        title: `Example ${i}`,
        description: `Description for example ${i}`,
        author: `Author ${i % 4}`,
        thumbnail: `https://example.com/thumb${i}.jpg`,
        favicon: `https://example.com/favicon${i}.ico`,
        profileId: mockProfiles[1].id,
        savedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      })),
      ...mockItems.slice(0, 2).map((item, i) => ({
        id: v4(),
        itemId: item.id,
        title: `Example ${i}`,
        description: `Description for example ${i}`,
        author: `Author ${i % 4}`,
        thumbnail: `https://example.com/thumb${i}.jpg`,
        favicon: `https://example.com/favicon${i}.ico`,
        profileId: DEFAULT_TEST_PROFILE_ID_2,
        savedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        lastReadAt: new Date(),
      })),
    ];

    beforeAll(async () => {
      new Array(2).fill(0).forEach(async (_, i) => {
        await testDb.raw.query(`
      INSERT INTO auth.users (id, email)
      VALUES ('${userIds[i]}', 'extra${i}@curi.ooo')
      ON CONFLICT (id) DO NOTHING;
    `);
      });
      await db.insert(profiles).values(mockProfiles);
    });

    beforeEach(async () => {
      await db.insert(items).values(mockItems);
      await db.insert(profileItems).values(mockProfileItems);
    });

    afterAll(async () => {
      await db.delete(profiles).where(
        eq(
          profiles.id,
          sql`ANY(ARRAY[${sql.join(
            mockProfiles.map((p) => sql`${p.id}`),
            sql`, `,
          )}]::uuid[])`,
        ),
      );
      await testDb.raw.query(
        `DELETE FROM auth.users WHERE id = ANY($1::uuid[]);`,
        [userIds],
      );
    });

    it("should return recommendation sections in order", async () => {
      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const { recommendations } = await response.json();

      expect(recommendations[0].sectionType).toBe(RecommendationType.POPULAR);
      expect(recommendations[1].sectionType).toBe(
        PersonalRecommendationType.NEWSLETTER,
      );
      expect(recommendations[2].sectionType).toBe(
        PersonalRecommendationType.FAVORITE_AUTHOR,
      );
      expect(recommendations[3].sectionType).toBe(
        PersonalRecommendationType.FAVORITES,
      );
    });

    it("should store and return consistent profileItemIds that belong to the user", async () => {
      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
        userId: DEFAULT_TEST_USER_ID_2,
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const { recommendations } = await response.json();
      const returnedRecommendations = recommendations
        .map((r: RecommendationSection) => r.items)
        .flat();

      const storedRecommendations = await db
        .select()
        .from(profileItemRecommendations)
        .where(
          eq(profileItemRecommendations.profileId, DEFAULT_TEST_PROFILE_ID_2),
        );

      await Promise.all(
        storedRecommendations.map(async (r) => {
          expect(r.profileId).toBe(DEFAULT_TEST_PROFILE_ID_2);
          const result = await db
            .select({ profileItemId: profileItems.id })
            .from(profileItems)
            .where(
              and(
                eq(profileItems.itemId, r.itemId),
                eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID_2),
              ),
            );
          if (r.profileItemId) {
            expect(result[0].profileItemId).toBe(r.profileItemId);
            expect(
              returnedRecommendations.find(
                (i: ItemResult | PublicItemResult) => i.id === r.itemId,
              ).profileItemId,
            ).toEqual(r.profileItemId);
          } else {
            expect(result.length).toBe(0);
            expect(
              returnedRecommendations.find(
                (i: ItemResult | PublicItemResult) => i.id === r.itemId,
              )?.id,
            ).toEqual(r.itemId);
          }
        }),
      );
    });

    it("should return 200 with popular items", async () => {
      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const { recommendations } = await response.json();
      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );
      // Item 0: 1, 2, 3, 4
      // Item 1: 3, 4
      // Item 2: 2, 3
      // Item 3: 3
      // Item 4: 1, 2, 3
      // Item 5: none
      // Item 6: none
      // Item 7: none
      expect(popularSection.items).toHaveLength(5);
      expect(popularSection.items[0].id).toBe(mockItems[0].id);
      expect(popularSection.items[0].profileItemId).toBe(
        mockProfileItems[0].id,
      );
      expect(popularSection.items[1].id).toBe(mockItems[4].id);
      expect(popularSection.items[1].profileItemId).toBe(
        mockProfileItems[4].id,
      );
      expect([
        popularSection.items[2].id,
        popularSection.items[3].id,
      ]).toContain(mockItems[2].id);
      expect([
        popularSection.items[2].id,
        popularSection.items[3].id,
      ]).toContain(mockItems[1].id);
      expect(popularSection.items[4].id).toBe(mockItems[3].id);
      expect(popularSection.items[4].profileItemId).toBe(
        mockProfileItems[3].id,
      );
    });

    it("should return 200 with popular items even if not saved", async () => {
      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
        userId: DEFAULT_TEST_USER_ID_2,
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const { recommendations } = await response.json();
      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );
      expect(popularSection.items[0].profileItemId).toBe(
        mockProfileItems[mockProfileItems.length - 2].id,
      );
      expect(popularSection.items[1].profileItemId).toBe(null);
      expect([
        popularSection.items[2].profileItemId,
        popularSection.items[3].profileItemId,
      ]).toContain(mockProfileItems[mockProfileItems.length - 1].id);
      expect(popularSection.items[4].profileItemId).toBe(null);
    });

    it("should return 200 with items from author if all are read", async () => {
      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
        userId: DEFAULT_TEST_USER_ID_2,
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const { recommendations } = await response.json();
      const authorSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITE_AUTHOR,
      );
      expect(authorSection.items).toHaveLength(2);
      expect(authorSection.items[0].profileItemId).toBe(null);
      expect(authorSection.items[1].profileItemId).toBe(null);
      expect(authorSection.items[0].id).toBe(mockItems[4].id);
      expect(authorSection.items[1].id).toBe(mockItems[5].id);
    });

    it("should return 200 with random favorited items", async () => {
      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: "https://example.com/api/v1/items/recommended",
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const { recommendations } = await response.json();
      const favoritesSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITES,
      );
      expect(favoritesSection?.items.length).toBe(4);
      expect(favoritesSection.items.map((i: ItemResult) => i.id)).toEqual(
        expect.arrayContaining([
          mockItems[0].id,
          mockItems[2].id,
          mockItems[4].id,
          mockItems[6].id,
        ]),
      );
      expect(
        favoritesSection.items.map((i: ItemResult) => i.profileItemId),
      ).toEqual(
        expect.arrayContaining([
          mockProfileItems[0].id,
          mockProfileItems[2].id,
          mockProfileItems[4].id,
          mockProfileItems[6].id,
        ]),
      );
    });
  });

  it("should return 401 for non-existent users", async () => {
    const request = makeAuthenticatedMockRequest({
      method: "GET",
      url: "https://example.com/api/v1/items/recommended",
      userId: NONEXISTENT_USER_ID,
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should return 200 with all sections when no items found", async () => {
    const request = makeAuthenticatedMockRequest({
      method: "GET",
      url: "https://example.com/api/v1/items/recommended",
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(GetRecommendationsResponseSchema.safeParse(json).success).toBe(true);

    const { recommendations } = json;

    Object.values(PersonalRecommendationType).forEach((sectionType) => {
      const section = recommendations.find(
        (r: RecommendationSection) => r.sectionType === sectionType,
      );
      expect(section?.items).toHaveLength(0);
    });
  });
});
