import { eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import { items, ItemState, profileItems } from "@/db/schema";
import { getItemMetadata } from "@/lib/storage/__mocks__/index";
import { APIRequest } from "@/utils/api";
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
  TEST_ITEM_ID_1,
  TEST_ITEM_ID_2,
  TEST_ITEM_ID_3,
  TEST_ITEM_ID_DELETED,
} from "@/utils/test/data";
import { testDb } from "@/utils/test/provider";

import { POST } from "./route";

describe("/api/v1/items/save", () => {
  describe("POST /api/v1/items/save", () => {
    beforeEach(async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    });

    it("should return 200 when saving an item", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
        },
        userId: DEFAULT_TEST_USER_ID_2,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        { slug: "example-com", profileItemId: expect.any(String) },
      ]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID_2))
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_1);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_3);
      expect(
        (updatedItems[0].savedAt as Date).getTime() >
          (updatedItems[1].savedAt as Date).getTime(),
      ).toBe(true);
    });

    it("should return 200 when saving an item with publishedAt", async () => {
      getItemMetadata.mockResolvedValueOnce({
        title: "Blank title",
        publishedAt: "2023-01-01T00:00:00.000Z",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
        },
        userId: DEFAULT_TEST_USER_ID_2,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        { slug: "example-com", profileItemId: expect.any(String) },
      ]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID_2))
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_1);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_3);
      expect(
        (updatedItems[0].savedAt as Date).getTime() >
          (updatedItems[1].savedAt as Date).getTime(),
      ).toBe(true);
    });
    it("should return 200 when item is already saved", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example2-com",
        },
      });
      const originalItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.id, MOCK_PROFILE_ITEMS[1].id));
      const originalSavedAt = originalItem[0].savedAt;

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID))
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_2);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_1);
      expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
      expect(updatedItems[3].itemId).toBe(TEST_ITEM_ID_DELETED);
      expect(updatedItems[0].savedAt).toEqual(originalSavedAt);
    });

    it("should return 200 and only save unsaved items", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example2-com,example3-com",
        },
      });
      const originalItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.id, MOCK_PROFILE_ITEMS[2].id));
      const originalStateUpdatedAt = originalItem[0].stateUpdatedAt;

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        { slug: "example3-com", profileItemId: expect.any(String) },
      ]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID))
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_2);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_1);
      expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
      expect(updatedItems[2].state).toBe(ItemState.ACTIVE);
      expect(updatedItems[2].stateUpdatedAt).not.toEqual(
        originalStateUpdatedAt,
      );
      expect(updatedItems[3].itemId).toBe(TEST_ITEM_ID_DELETED);
    });

    it("should return 200 and update all saved items to active", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com,example2-com,example3-com,example4-com",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        {
          slug: "example-com",
          profileItemId: MOCK_PROFILE_ITEMS[0].id,
        },
        { slug: "example3-com", profileItemId: expect.any(String) },
        {
          slug: "example4-com",
          profileItemId: MOCK_PROFILE_ITEMS[3].id,
        },
      ]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID))
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_2);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_1);
      expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
      expect(updatedItems[3].itemId).toBe(TEST_ITEM_ID_DELETED);
      updatedItems.forEach((item) => expect(item.state).toBe(ItemState.ACTIVE));
    });

    it("should return 200 on invalid slugs", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example3-com,invalid-slug",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        { slug: "example3-com", profileItemId: expect.any(String) },
      ]);
    });

    it("should return 200 when user has no items", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
        },
        userId: DEFAULT_TEST_USER_ID_2,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        { slug: "example-com", profileItemId: expect.any(String) },
      ]);
    });

    it("should return 400 if request body is invalid", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: [],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 401 if user profile not found", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        userId: NONEXISTENT_USER_ID,
        body: {
          slugs: "example-com,example2-com,example3-com,example4-com",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 500 if database error occurs", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com,example2-com,example3-com,example4-com",
        },
      });

      vi.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
