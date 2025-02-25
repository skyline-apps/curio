import { DbErrorCode } from "@/db/errors";
import { items, ItemState, profileItems } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { POST } from "./route";

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_URL_1 = "https://example.com";
const TEST_ITEM_ID_2 = "123e4567-e89b-12d3-a456-426614174002";
const TEST_ITEM_URL_2 = "https://example2.com";
const TEST_ITEM_ID_3 = "123e4567-e89b-12d3-a456-426614174003";
const TEST_ITEM_URL_3 = "https://example3.com";
const TEST_ITEM_ID_DELETED = "123e4567-e89b-12d3-a456-426614174004";
const TEST_ITEM_URL_DELETED = "https://example4.com";
const NONEXISTENT_USER_ID = "123e4567-e89b-12d3-a456-426614174003";

const MOCK_ITEMS = [
  {
    id: TEST_ITEM_ID,
    url: TEST_ITEM_URL_1,
    slug: "example-com",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_2,
    url: TEST_ITEM_URL_2,
    slug: "example2-com",
    createdAt: new Date("2025-01-10T12:53:56-08:00"),
    updatedAt: new Date("2025-01-10T12:53:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_3,
    url: TEST_ITEM_URL_3,
    slug: "example3-com",
    createdAt: new Date("2025-01-10T12:54:56-08:00"),
    updatedAt: new Date("2025-01-10T12:54:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_DELETED,
    url: TEST_ITEM_URL_DELETED,
    slug: "example4-com",
    createdAt: new Date("2025-01-10T12:54:56-08:00"),
    updatedAt: new Date("2025-01-10T12:54:56-08:00"),
  },
];

const MOCK_PROFILE_ITEMS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174999",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID,
    title: "Example 1",
    description: "First example item",
    author: "Test Author",
    state: ItemState.ACTIVE,
    stateUpdatedAt: new Date("2024-04-30T12:52:59-08:00"),
    thumbnail: "https://example.com/thumb1.jpg",
    favicon: "https://example.com/favicon1.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174997",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_2,
    title: "Example 2",
    description: "Second example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb2.jpg",
    favicon: "https://example.com/favicon2.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:58-08:00"),
    state: ItemState.ARCHIVED,
    stateUpdatedAt: new Date("2024-04-20T12:52:59-08:00"),
    isFavorite: false,
    readingProgress: 10,
    lastReadAt: new Date("2025-01-15T12:00:00-08:00"),
    versionName: "2024-01-01",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174998",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_DELETED,
    title: "Example item 4",
    description: "Deleted item",
    author: "Test Author",
    state: ItemState.DELETED,
    stateUpdatedAt: new Date("2024-04-25T12:52:59-08:00"),
    isFavorite: true,
    thumbnail: "https://example.com/thumb2.jpg",
    favicon: "https://example.com/favicon2.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:57-08:00"),
  },
];

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
          slugs: "example3-com",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        { slug: "example3-com", profileItemId: expect.any(String) },
      ]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_2);
      expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
      expect(updatedItems[3].itemId).toBe(TEST_ITEM_ID_DELETED);
    });

    it("should return 200 when item is already saved", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(3);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_2);
      expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_DELETED);
    });

    it("should return 200 and only save unsaved items", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com,example3-com",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.updated).toEqual([
        { slug: "example3-com", profileItemId: expect.any(String) },
      ]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_2);
      expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
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
          slug: "example2-com",
          profileItemId: "123e4567-e89b-12d3-a456-426614174997",
        },
        { slug: "example3-com", profileItemId: expect.any(String) },
        {
          slug: "example4-com",
          profileItemId: "123e4567-e89b-12d3-a456-426614174998",
        },
      ]);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .orderBy(profileItems.itemId);
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID);
      expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_2);
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
