import { and, eq, sql } from "@api/db";
import {
  itemRecommendations,
  items,
  ItemSource,
  PersonalRecommendationType,
  profileItemRecommendations,
  profileItems,
  profiles,
  RecommendationType,
} from "@api/db/schema";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  DEFAULT_TEST_USER_ID_2,
  getRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import { MOCK_ITEMS, MOCK_PROFILE_ITEMS } from "@api/utils/test/data";
import { testDb } from "@api/utils/test/provider";
import { ItemResult, PublicItemResult } from "@api/v1/items/validation";
import { Hono } from "hono";
import { v4 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { itemsRecommendedRouter } from "./index";
import {
  GetRecommendationsResponse,
  RecommendationSection,
} from "./validation";

describe("GET /v1/items/recommended", () => {
  let app: Hono<EnvBindings>;

  describe("using default test data", () => {
    const recentItem = {
      id: "123e4567-e89b-12d3-a456-426614199999",
      profileId: DEFAULT_TEST_PROFILE_ID_2,
      itemId: MOCK_ITEMS[0].id,
      title: "recent item",
      savedAt: new Date(),
      thumbnail: "https://example.com/thumb5.jpg",
    };
    beforeEach(async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    });

    beforeAll(() => {
      app = setUpMockApp("/v1/items/recommended", itemsRecommendedRouter);
    });

    it("should return recommendations for a user with private pre-existing recommendations", async () => {
      await testDb.db.insert(itemRecommendations).values([
        {
          itemId: MOCK_ITEMS[0].id,
          type: RecommendationType.POPULAR,
          createdAt: new Date(),
        },
      ]);
      await testDb.db.insert(profileItemRecommendations).values([
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

      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
      expect(recommendations.length).toBe(4);

      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );
      expect(popularSection).toBeDefined();
      expect(popularSection?.items).toHaveLength(1);
      expect(popularSection?.items[0].id).toBe(MOCK_ITEMS[0].id);
      expect(popularSection?.items[0].profileItemId).toBe(
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
      const favoriteMetadata = favoritesSection?.items[0]
        .metadata as ItemResult["metadata"];
      expect(favoriteMetadata?.title).toBe(MOCK_PROFILE_ITEMS[1].title);
      expect(favoriteMetadata?.author).toBe(MOCK_PROFILE_ITEMS[1].author);
      expect(favoriteMetadata?.description).toBe(
        MOCK_PROFILE_ITEMS[1].description,
      );
      expect(favoriteMetadata?.isFavorite).toBe(true);

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
      expect(newsletterSection).toBeDefined();
      expect(newsletterSection?.items).toHaveLength(0);
    });

    it("should filter out deleted items' profileItemId", async () => {
      await testDb.db.insert(itemRecommendations).values([
        {
          itemId: MOCK_ITEMS[3].id,
          type: RecommendationType.POPULAR,
          createdAt: new Date(),
        },
      ]);

      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
      expect(recommendations.length).toBe(4);

      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );
      expect(popularSection?.items).toHaveLength(1);
      expect(popularSection?.items[0].id).toBe(MOCK_ITEMS[3].id);
      expect(popularSection?.items[0].profileItemId).toBe(null);
    });

    it("should compute new recommendations for user with no existing recommendations", async () => {
      await testDb.db.insert(profileItems).values([recentItem]);

      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      // Check that recommendations were created in the database
      const globalRecommendations = await testDb.db
        .select()
        .from(itemRecommendations);
      expect(globalRecommendations.length).toBe(1);
      expect(globalRecommendations[0].itemId).toBe(MOCK_ITEMS[0].id);

      const storedRecommendations = await testDb.db
        .select()
        .from(profileItemRecommendations)
        .where(
          eq(profileItemRecommendations.profileId, DEFAULT_TEST_PROFILE_ID),
        );

      expect(storedRecommendations.length).toBe(2);

      // Verify response structure and content
      const { recommendations }: GetRecommendationsResponse =
        await response.json();

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
      expect(authorItems?.items[0].id).toBe(MOCK_ITEMS[1].id);
      expect(authorItems?.items[0].profileItemId).toBe(
        MOCK_PROFILE_ITEMS[1].id,
      );
      expect(authorItems?.items[0].metadata.author).toBe(
        MOCK_PROFILE_ITEMS[1].author,
      );
    });

    it("should recompute global recommendations if they are over a week old", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);

      await testDb.db.insert(profileItems).values([recentItem]);
      await testDb.db.insert(itemRecommendations).values({
        itemId: MOCK_ITEMS[3].id,
        type: RecommendationType.POPULAR,
        createdAt: oldDate,
      });

      const response = await getRequest(app, "v1/items/recommended");
      const { recommendations }: GetRecommendationsResponse =
        await response.json();

      const globalRecommendations = await testDb.db
        .select()
        .from(itemRecommendations);
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
      await testDb.db.insert(itemRecommendations).values({
        itemId: MOCK_ITEMS[0].id,
        type: RecommendationType.POPULAR,
        createdAt: new Date(),
      });

      await testDb.db.insert(profileItemRecommendations).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: MOCK_ITEMS[1].id,
        profileItemId: MOCK_PROFILE_ITEMS[1].id,
        type: PersonalRecommendationType.FAVORITES,
        createdAt: oldDate,
      });

      const response = await getRequest(app, "v1/items/recommended");
      const { recommendations }: GetRecommendationsResponse =
        await response.json();

      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );

      expect(popularSection).toBeDefined();
      expect(popularSection?.items.length).toBe(1);
      expect(popularSection?.items[0].id).toBe(MOCK_ITEMS[0].id);

      // Check that the old recommendation was replaced with fresh ones
      const storedRecommendations = await testDb.db
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
      await testDb.db.insert(profileItemRecommendations).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: MOCK_ITEMS[1].id,
        profileItemId: MOCK_PROFILE_ITEMS[1].id,
        type: PersonalRecommendationType.FAVORITES,
        createdAt: new Date(),
      });

      // Mark the item as read
      await testDb.db
        .update(profileItems)
        .set({
          lastReadAt: new Date(),
          readingProgress: 100,
        })
        .where(eq(profileItems.id, MOCK_PROFILE_ITEMS[1].id));

      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      // Check that recommendations were recomputed
      const storedRecommendations = await testDb.db
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

    it("should ignore items without thumbnails", async () => {
      await testDb.db
        .insert(profileItems)
        .values({ ...recentItem, thumbnail: null });

      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      // Check that recommendations were created in the database
      const globalRecommendations = await testDb.db
        .select()
        .from(itemRecommendations);
      expect(globalRecommendations.length).toBe(0);
    });

    it("should not include newsletters in newsletters but not popular section", async () => {
      app = setUpMockApp(
        "/v1/items/recommended",
        itemsRecommendedRouter,
        DEFAULT_TEST_USER_ID_2,
      );
      await testDb.db
        .insert(profileItems)
        .values({ ...recentItem, source: ItemSource.EMAIL });
      const response = await getRequest(app, "v1/items/recommended");

      expect(response.status).toBe(200);

      // Check that recommendations were created in the database
      const globalRecommendations = await testDb.db
        .select()
        .from(itemRecommendations);
      expect(globalRecommendations.length).toBe(0);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
      const newsletterSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.NEWSLETTER,
      );
      expect(newsletterSection?.items.length).toBe(1);
      expect(newsletterSection?.items[0].id).toBe(MOCK_ITEMS[0].id);
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

    const date = new Date();
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
        stateUpdatedAt: new Date(date.getTime() + i),
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
        stateUpdatedAt: new Date(date.getTime() + i + 1000),
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
        stateUpdatedAt: new Date(date.getTime() + i + 2000),
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
        stateUpdatedAt: new Date(date.getTime() + i + 3000),
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
      await testDb.db.insert(profiles).values(mockProfiles);
    });

    beforeEach(async () => {
      await testDb.db.insert(items).values(mockItems);
      await testDb.db.insert(profileItems).values(mockProfileItems);
    });

    afterAll(async () => {
      await testDb.db.delete(profiles).where(
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
      app = setUpMockApp("/v1/items/recommended", itemsRecommendedRouter);
      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();

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
      app = setUpMockApp(
        "/v1/items/recommended",
        itemsRecommendedRouter,
        DEFAULT_TEST_USER_ID_2,
      );
      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
      const returnedRecommendations = recommendations
        .map((r: RecommendationSection) => r.items)
        .flat();

      const storedRecommendations = await testDb.db
        .select()
        .from(profileItemRecommendations)
        .where(
          eq(profileItemRecommendations.profileId, DEFAULT_TEST_PROFILE_ID_2),
        );

      await Promise.all(
        storedRecommendations.map(async (r) => {
          expect(r.profileId).toBe(DEFAULT_TEST_PROFILE_ID_2);
          const result = await testDb.db
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
              )?.profileItemId,
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
      app = setUpMockApp("/v1/items/recommended", itemsRecommendedRouter);
      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
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
      expect(popularSection?.items).toHaveLength(5);
      expect(popularSection?.items[0].id).toBe(mockItems[0].id);
      expect(popularSection?.items[0].profileItemId).toBe(
        mockProfileItems[0].id,
      );
      expect(popularSection?.items[1].id).toBe(mockItems[4].id);
      expect(popularSection?.items[1].profileItemId).toBe(
        mockProfileItems[4].id,
      );
      expect([
        popularSection?.items[2].id,
        popularSection?.items[3].id,
      ]).toContain(mockItems[2].id);
      expect([
        popularSection?.items[2].id,
        popularSection?.items[3].id,
      ]).toContain(mockItems[1].id);
      expect(popularSection?.items[4].id).toBe(mockItems[3].id);
      expect(popularSection?.items[4].profileItemId).toBe(
        mockProfileItems[3].id,
      );
    });

    it("should return 200 with popular items even if not saved", async () => {
      app = setUpMockApp(
        "/v1/items/recommended",
        itemsRecommendedRouter,
        DEFAULT_TEST_USER_ID_2,
      );
      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
      const popularSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === RecommendationType.POPULAR,
      );
      expect(popularSection?.items[0].profileItemId).toBe(
        mockProfileItems[mockProfileItems.length - 2].id,
      );
      expect(popularSection?.items[1].profileItemId).toBe(null);
      expect([
        popularSection?.items[2].profileItemId,
        popularSection?.items[3].profileItemId,
      ]).toContain(mockProfileItems[mockProfileItems.length - 1].id);
      expect(popularSection?.items[4].profileItemId).toBe(null);
    });

    it("should return 200 with items from author if all are read", async () => {
      app = setUpMockApp(
        "/v1/items/recommended",
        itemsRecommendedRouter,
        DEFAULT_TEST_USER_ID_2,
      );
      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
      const authorSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITE_AUTHOR,
      );
      expect(authorSection?.items).toHaveLength(2);
      expect(authorSection?.items[0].profileItemId).toBe(null);
      expect(authorSection?.items[1].profileItemId).toBe(null);
      expect(authorSection?.items[0].id).toBe(mockItems[4].id);
      expect(authorSection?.items[1].id).toBe(mockItems[5].id);
    });

    it("should return 200 with random favorited items", async () => {
      app = setUpMockApp("/v1/items/recommended", itemsRecommendedRouter);
      const response = await getRequest(app, "v1/items/recommended");
      expect(response.status).toBe(200);

      const { recommendations }: GetRecommendationsResponse =
        await response.json();
      const favoritesSection = recommendations.find(
        (r: RecommendationSection) =>
          r.sectionType === PersonalRecommendationType.FAVORITES,
      );
      expect(favoritesSection?.items.length).toBe(4);
      expect(
        favoritesSection?.items.map((i: PublicItemResult | ItemResult) => i.id),
      ).toEqual(
        expect.arrayContaining([
          mockItems[0].id,
          mockItems[2].id,
          mockItems[4].id,
          mockItems[6].id,
        ]),
      );
      expect(
        favoritesSection?.items.map(
          (i: PublicItemResult | ItemResult) => i.profileItemId,
        ),
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

  it("should return 200 with all sections when no items found", async () => {
    app = setUpMockApp("/v1/items/recommended", itemsRecommendedRouter);
    const response = await getRequest(app, "v1/items/recommended");
    expect(response.status).toBe(200);

    const { recommendations }: GetRecommendationsResponse =
      await response.json();

    Object.values(PersonalRecommendationType).forEach((sectionType) => {
      const section = recommendations.find(
        (r: RecommendationSection) => r.sectionType === sectionType,
      );
      expect(section?.items).toHaveLength(0);
    });
  });
});
