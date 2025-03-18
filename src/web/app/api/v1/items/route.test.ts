import { vi } from "vitest";

import { and, desc, eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import {
  items,
  ItemState,
  profileItemLabels,
  profileItems,
  profileLabels,
  TextDirection,
} from "@/db/schema";
import { searchDocuments } from "@/lib/search";
import { SearchError } from "@/lib/search/types";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_USER_ID_2,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_LABELS,
  MOCK_PROFILE_ITEM_LABELS,
  MOCK_PROFILE_ITEMS,
  NONEXISTENT_USER_ID,
  TEST_ITEM_ID_1,
  TEST_ITEM_ID_2,
  TEST_ITEM_ID_3,
  TEST_ITEM_ID_DELETED,
  TEST_ITEM_URL_1,
  TEST_ITEM_URL_2,
  TEST_LABEL_ID_1,
  TEST_LABEL_ID_2,
} from "@/utils/test/data";
import { testDb } from "@/utils/test/provider";

import { GET, POST } from "./route";

describe("/api/v1/items", () => {
  describe("GET /api/v1/items", () => {
    it("should return 200 with the user's items via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.total).toBe(1);
      expect(data.items[0].metadata).toEqual({
        author: "Test Author",
        description: "First example item",
        publishedAt: "2025-01-10T20:52:56.000Z",
        thumbnail: "https://example.com/thumb1.jpg",
        favicon: "https://example.com/favicon1.ico",
        textDirection: TextDirection.LTR,
        textLanguage: "en",
        title: "Example 1",
        savedAt: "2025-01-10T20:52:56.000Z",
        stateUpdatedAt: "2024-04-30T20:52:59.000Z",
        isFavorite: false,
        lastReadAt: null,
        readingProgress: 0,
        state: ItemState.ARCHIVED,
        source: null,
        versionName: null,
      });
      expect(data.items[0].labels).toEqual([]);
    });

    it("should return items with their associated labels", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(3);
      expect(data.items[0].labels).toEqual([
        {
          id: TEST_LABEL_ID_1,
          name: "Test Label 1",
          color: "#ff0000",
        },
        {
          id: TEST_LABEL_ID_2,
          name: "Test Label 2",
          color: "#00ff00",
        },
      ]);
      expect(data.items[1].labels).toEqual([
        {
          id: TEST_LABEL_ID_1,
          name: "Test Label 1",
          color: "#ff0000",
        },
      ]);
      expect(data.items[2].labels).toEqual([]);
    });

    it("should return 200 with the user's items via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.total).toBe(1);
      expect(data.items[0].metadata).toEqual({
        author: "Test Author",
        description: "First example item",
        publishedAt: "2025-01-10T20:52:56.000Z",
        thumbnail: "https://example.com/thumb1.jpg",
        favicon: "https://example.com/favicon1.ico",
        textDirection: TextDirection.LTR,
        textLanguage: "en",
        title: "Example 1",
        savedAt: "2025-01-10T20:52:56.000Z",
        stateUpdatedAt: "2024-04-30T20:52:59.000Z",
        isFavorite: false,
        lastReadAt: null,
        readingProgress: 0,
        state: ItemState.ARCHIVED,
        source: null,
        versionName: null,
      });
      expect(data.items[0].labels).toEqual([]);
    });

    it("should return 200 with active items sorted by stateUpdatedAt desc", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values([
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          itemId: TEST_ITEM_ID_1,
          title: "Item 1",
          state: ItemState.ACTIVE,
          stateUpdatedAt: new Date("2025-01-12T12:52:56-08:00"),
          savedAt: new Date("2025-01-30T12:52:56-08:00"),
        },
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          itemId: TEST_ITEM_ID_2,
          title: "Item 2",
          state: ItemState.ACTIVE,
          stateUpdatedAt: new Date("2025-01-22T12:52:56-08:00"),
          savedAt: new Date("2025-01-20T12:52:56-08:00"),
        },
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          itemId: TEST_ITEM_ID_3,
          title: "Item 3",
          state: ItemState.ACTIVE,
          stateUpdatedAt: new Date("2025-01-17T12:52:56-08:00"),
          savedAt: new Date("2025-01-10T12:52:56-08:00"),
        },
      ]);

      const params = new URLSearchParams({
        limit: "2",
        filters: JSON.stringify({ state: ItemState.ACTIVE }),
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.nextCursor).toBe("2025-01-17T20:52:56.000Z");
      expect(data.items[0].id).toBe(TEST_ITEM_ID_2);
      expect(data.items[1].id).toBe(TEST_ITEM_ID_3);
    });

    it("should support cursor-based pagination", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        limit: "2",
      });
      const firstRequest: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const firstResponse = await GET(firstRequest);
      expect(firstResponse.status).toBe(200);

      const firstData = await firstResponse.json();
      expect(firstData.items).toHaveLength(2);
      expect(firstData.total).toBe(3);
      expect(firstData.nextCursor).toBe(
        MOCK_PROFILE_ITEMS[1].stateUpdatedAt.toISOString(),
      );
      expect(firstData.items[0].id).toBe(TEST_ITEM_ID_1); // Most recent first
      expect(firstData.items[1].id).toBe(TEST_ITEM_ID_2);

      const secondParams = new URLSearchParams({
        limit: "2",
        cursor: firstData.nextCursor,
      });
      const secondRequest: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${secondParams.toString()}`,
      });

      const secondResponse = await GET(secondRequest);
      expect(secondResponse.status).toBe(200);

      const secondData = await secondResponse.json();
      expect(secondData.items).toHaveLength(1);
      expect(secondData.total).toBe(3);
      expect(secondData.nextCursor).toBeUndefined(); // No more pages
      expect(secondData.items[0].id).toBe(TEST_ITEM_ID_3); // Last item
    });

    it("should support offset-based pagination when searching", async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [
          {
            slug: MOCK_ITEMS[1].slug,
            url: MOCK_ITEMS[1].url,
            title: MOCK_PROFILE_ITEMS[1].title,
            _formatted: { content: "blah2" },
          },
          {
            slug: MOCK_ITEMS[0].slug,
            url: MOCK_ITEMS[0].url,
            title: MOCK_PROFILE_ITEMS[0].title,
            _formatted: { content: "blah" },
          },
        ],
        estimatedTotalHits: 3,
      });

      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        limit: "2",
        search: "universal",
      });
      const firstRequest: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const firstResponse = await GET(firstRequest);
      expect(firstResponse.status).toBe(200);

      const firstData = await firstResponse.json();
      expect(firstData.items).toHaveLength(2);
      expect(firstData.total).toBe(3);
      expect(firstData.nextOffset).toBe(2);
      expect(firstData.items[0].id).toBe(TEST_ITEM_ID_2);
      expect(firstData.items[0].excerpt).toBe("blah2");
      expect(firstData.items[1].id).toBe(TEST_ITEM_ID_1);
      expect(firstData.items[1].excerpt).toBe("blah");
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [
          {
            slug: MOCK_ITEMS[2].slug,
            url: MOCK_ITEMS[2].url,
            title: MOCK_PROFILE_ITEMS[2].title,
            _formatted: { content: "blah3" },
          },
        ],
        estimatedTotalHits: 3,
      });

      const secondParams = new URLSearchParams({
        limit: "2",
        offset: "2",
        search: "universal",
      });
      const secondRequest: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${secondParams.toString()}`,
      });

      const secondResponse = await GET(secondRequest);
      expect(secondResponse.status).toBe(200);

      const secondData = await secondResponse.json();
      expect(secondData.items).toHaveLength(1);
      expect(secondData.total).toBe(3);
      expect(secondData.nextOffset).toBeUndefined();
      expect(secondData.items[0].id).toBe(TEST_ITEM_ID_3);
      expect(secondData.items[0].excerpt).toBe("blah3");
    });

    it("should return 200 when fetching specific slugs", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        slugs: "example-com,example2-com",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.items[1].id).toBe(TEST_ITEM_ID_2);
      expect(data.total).toBe(2);
    });

    it("should return 200 when fetching specific urls", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        urls: "https://example2.com?query=val,https://example3.com/",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_2);
      expect(data.items[0].metadata.versionName).toBe(null);
      expect(data.items[0].metadata.lastReadAt).toBe(null);
      expect(data.items[0].metadata.isFavorite).toBe(true);
      expect(data.items[0].metadata.readingProgress).toBe(0);
      expect(data.items[0].metadata.state).toBe(ItemState.ACTIVE);
      expect(data.items[1].id).toBe(TEST_ITEM_ID_3);
      expect(data.items[1].metadata.versionName).toBe("2024-01-01");
      expect(data.items[1].metadata.lastReadAt).toBe(
        "2025-01-15T20:00:00.000Z",
      );
      expect(data.items[1].metadata.isFavorite).toBe(false);
      expect(data.items[1].metadata.readingProgress).toBe(10);
      expect(data.items[1].metadata.state).toBe(ItemState.ARCHIVED);
      expect(data.total).toBe(2);
    });

    it("should return 200 when applying a filter", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        filters: JSON.stringify({
          state: ItemState.DELETED,
        }),
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_DELETED);
      expect(data.total).toBe(1);
      expect(searchDocuments).not.toHaveBeenCalled();
    });

    it("should return 200 when applying multiple filters", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        filters: JSON.stringify({
          state: ItemState.ACTIVE,
          isFavorite: true,
        }),
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_2);
      expect(data.total).toBe(1);
      expect(searchDocuments).not.toHaveBeenCalled();
    });

    it("should return 200 with empty results if search has no results", async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [],
        estimatedTotalHits: 0,
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const params = new URLSearchParams({
        search: "NO MATCHES",
      });

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(0);
      expect(data.total).toBe(0);
      expect(searchDocuments).toHaveBeenCalledTimes(1);
    });

    it("should return 200 when fuzzy searching items", async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [
          {
            slug: MOCK_ITEMS[1].slug,
            url: MOCK_ITEMS[1].url,
            title: MOCK_PROFILE_ITEMS[1].title,
            _formatted: { content: "blah blah" },
          },
        ],
        estimatedTotalHits: 1,
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const params = new URLSearchParams({
        search: "hellO",
      });

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_2);
      expect(data.total).toBe(1);
      expect(searchDocuments).toHaveBeenCalledTimes(1);
      expect(searchDocuments).toHaveBeenCalledWith("hellO", {
        attributesToCrop: ["content"],
        attributesToHighlight: ["content"],
        limit: 20,
        offset: 0,
      });
    });

    it("should return 200 when falling back to naive database search for title / description", async () => {
      vi.mocked(searchDocuments).mockRejectedValueOnce(
        new SearchError("Search failed"),
      );
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const params = new URLSearchParams({
        search: "item 2",
      });

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_2);
      expect(data.items[1].id).toBe(TEST_ITEM_ID_3);
      expect(data.total).toBe(2);
      expect(searchDocuments).toHaveBeenCalledTimes(1);
      expect(searchDocuments).toHaveBeenCalledWith("item 2", {
        attributesToCrop: ["content"],
        attributesToHighlight: ["content"],
        limit: 20,
        offset: 0,
      });
    });

    it("should return 200 when falling back to naive database search for url", async () => {
      vi.mocked(searchDocuments).mockRejectedValueOnce(
        new SearchError("Search failed"),
      );
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const params = new URLSearchParams({
        search: "https://example.com",
      });

      const request = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.total).toBe(1);
      expect(searchDocuments).toHaveBeenCalledTimes(1);
      expect(searchDocuments).toHaveBeenCalledWith("https://example.com", {
        attributesToCrop: ["content"],
        attributesToHighlight: ["content"],
        limit: 20,
        offset: 0,
      });
    });

    it("should return 200 when combining filters and search", async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [
          {
            slug: MOCK_ITEMS[2].slug,
            url: MOCK_ITEMS[2].url,
            title: MOCK_PROFILE_ITEMS[2].title,
            _formatted: { content: "blah blah blah" },
          },
          {
            slug: MOCK_ITEMS[0].slug,
            url: MOCK_ITEMS[0].url,
            title: MOCK_PROFILE_ITEMS[0].title,
            _formatted: { content: "blah blah blah" },
          },
          {
            slug: MOCK_ITEMS[1].slug,
            url: MOCK_ITEMS[1].url,
            title: MOCK_PROFILE_ITEMS[1].title,
            _formatted: { content: "blah blah blah" },
          },
        ],
        estimatedTotalHits: 3,
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const params = new URLSearchParams({
        filters: JSON.stringify({
          state: ItemState.ARCHIVED,
          isFavorite: false,
        }),
        search: "item",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_3);
      expect(data.items[1].id).toBe(TEST_ITEM_ID_1);
      expect(data.total).toBe(3);
      expect(searchDocuments).toHaveBeenCalledTimes(1);
      expect(searchDocuments).toHaveBeenCalledWith("item", {
        attributesToCrop: ["content"],
        attributesToHighlight: ["content"],
        limit: 20,
        offset: 0,
      });
    });

    it("should return 200 with empty results and incremented offset", async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [
          {
            slug: MOCK_ITEMS[3].slug,
            url: MOCK_ITEMS[3].url,
            title: MOCK_PROFILE_ITEMS[3].title,
            _formatted: { content: "blah blah blah" },
          },
        ],
        estimatedTotalHits: 2,
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const params = new URLSearchParams({
        search: "item",
        limit: "1",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(0);
      expect(data.nextOffset).toBe(1);
      expect(data.total).toBe(2);
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [
          {
            slug: MOCK_ITEMS[2].slug,
            url: MOCK_ITEMS[2].url,
            title: MOCK_PROFILE_ITEMS[2].title,
            _formatted: { content: "blah blah blah" },
          },
        ],
        estimatedTotalHits: 2,
      });
      const params2 = new URLSearchParams({
        search: "item",
        limit: "1",
        offset: "1",
      });
      const request2: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params2.toString()}`,
      });

      const response2 = await GET(request2);
      expect(response2.status).toBe(200);

      const data2 = await response2.json();
      expect(data2.items).toHaveLength(1);
      expect(data2.nextOffset).toBe(undefined);
      expect(data2.total).toBe(2);
      expect(data2.items[0].id).toBe(TEST_ITEM_ID_3);
    });

    it("should return 200 and return only results belonging to the user", async () => {
      vi.mocked(searchDocuments).mockResolvedValueOnce({
        hits: [
          {
            slug: MOCK_ITEMS[2].slug,
            url: MOCK_ITEMS[2].url,
            title: MOCK_PROFILE_ITEMS[2].title,
            _formatted: { content: "blah blah blah" },
          },
        ],
        estimatedTotalHits: 1,
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const params = new URLSearchParams({
        search: "itemsearch",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
        userId: DEFAULT_TEST_USER_ID_2,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_3);
      expect(data.total).toBe(1);
      expect(searchDocuments).toHaveBeenCalledTimes(1);
      expect(searchDocuments).toHaveBeenCalledWith("itemsearch", {
        attributesToCrop: ["content"],
        attributesToHighlight: ["content"],
        limit: 20,
        offset: 0,
      });
    });

    it("should return 200 when filtering by inactive state ordering by stateUpdatedAt", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        filters: JSON.stringify({
          state: ItemState.ARCHIVED,
        }),
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.items[1].id).toBe(TEST_ITEM_ID_3);
      expect(data.total).toBe(2);
    });

    it("should return 200 with no label filters if list is empty", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);

      const params = new URLSearchParams({
        filters: JSON.stringify({
          labels: {
            ids: [],
          },
        }),
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(3);
    });

    it("should return 200 with label filters specified with AND", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);

      const params = new URLSearchParams({
        filters: JSON.stringify({
          labels: {
            operator: "and",
            ids: [TEST_LABEL_ID_1, TEST_LABEL_ID_2],
          },
        }),
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.total).toBe(1);
    });

    it("should return 200 with label filters specified with OR", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);

      const params = new URLSearchParams({
        filters: JSON.stringify({
          labels: {
            operator: "or",
            ids: [TEST_LABEL_ID_1, TEST_LABEL_ID_2],
          },
        }),
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.items[1].id).toBe(TEST_ITEM_ID_2);
      expect(data.total).toBe(2);
    });

    it("should return 200 on invalid thumbnail url", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID_1,
        title: "Example",
        description: "An example item",
        author: "Test Author",
        thumbnail: "bad",
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe(TEST_ITEM_ID_1);
      expect(data.items[0].metadata.thumbnail).toBe(null);
    });

    it("should return 400 when both slugs and urls are provided", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const params = new URLSearchParams({
        slugs: "example-com,example2-com",
        urls: "https://example2.com?query=val,https://example3.com/",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 with default limit if limit is invalid", async () => {
      const params = new URLSearchParams({
        limit: "0",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/items?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid request parameters");
    });

    it("should return 401 if user profile not found", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        userId: NONEXISTENT_USER_ID,
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("should return 401 when no valid auth is provided", async () => {
      const request: APIRequest = makeUnauthenticatedMockRequest({
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/items", () => {
    it("should return 200 creating untitled item via regular auth", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com?query=value",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        items: [
          {
            url: TEST_ITEM_URL_1,
            id: expect.any(String),
            profileItemId: expect.any(String),
            slug: expect.stringMatching(/^example-com-[a-f0-9]{6}$/),
            metadata: expect.objectContaining({
              title: "https://example.com",
            }),
            createdAt: expect.any(String),
          },
        ],
      });

      const savedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID));

      expect(savedItems).toEqual([
        expect.objectContaining({
          id: expect.any(String),
          state: "active",
          title: TEST_ITEM_URL_1,
          isFavorite: false,
          stateUpdatedAt: expect.any(Date),
          lastReadAt: null,
          savedAt: null,
        }),
      ]);
    });

    it("should return 200 updating item via regular auth", async () => {
      await testDb.db.insert(items).values({
        id: TEST_ITEM_ID_1,
        url: TEST_ITEM_URL_1,
        slug: "example-com-123456",
        createdAt: new Date("2025-01-10T12:52:56-08:00"),
        updatedAt: new Date("2025-01-10T12:52:56-08:00"),
      });
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID_1,
        title: "Old title",
        author: "Kim",
        savedAt: new Date("2024-01-10T12:52:56-08:00"),
        state: ItemState.ACTIVE,
        isFavorite: false,
        stateUpdatedAt: new Date("2024-04-10T12:52:56-08:00"),
        lastReadAt: null,
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: TEST_ITEM_URL_1,
              metadata: {
                title: "New title",
                description: "New description",
              },
            },
            {
              url: TEST_ITEM_URL_2,
              metadata: {
                title: "Example title",
              },
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        items: [
          {
            url: TEST_ITEM_URL_1,
            id: expect.any(String),
            profileItemId: expect.any(String),
            slug: expect.stringMatching(/^example-com-[a-f0-9]{6}$/),
            metadata: expect.objectContaining({
              title: "New title",
              description: "New description",
              author: "Kim",
              state: ItemState.ACTIVE,
              isFavorite: false,
              readingProgress: 0,
            }),
            createdAt: expect.any(String),
          },
          {
            url: TEST_ITEM_URL_2,
            id: expect.any(String),
            profileItemId: expect.any(String),
            slug: expect.stringMatching(/^example2-com-[a-f0-9]{6}$/),
            metadata: expect.objectContaining({
              title: "Example title",
              versionName: null,
            }),
            createdAt: expect.any(String),
          },
        ],
      });

      const dbItems = await testDb.db.select().from(items);

      expect(dbItems.length).toBe(2);

      const savedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID))
        .orderBy(desc(profileItems.stateUpdatedAt));

      expect(savedItems.length).toBe(2);

      expect(savedItems).toEqual([
        expect.objectContaining({
          itemId: expect.any(String),
          state: ItemState.ACTIVE,
          title: "Example title",
          description: null,
          isFavorite: false,
          stateUpdatedAt: expect.any(Date),
          lastReadAt: null,
        }),
        expect.objectContaining({
          itemId: TEST_ITEM_ID_1,
          state: ItemState.ACTIVE,
          title: "New title",
          description: "New description",
          author: "Kim",
          isFavorite: false,
          stateUpdatedAt: expect.any(Date),
          lastReadAt: null,
        }),
      ]);

      expect(savedItems[0].stateUpdatedAt).not.toEqual(
        new Date("2024-04-10T12:52:56-08:00"),
      );
      expect(savedItems[1].stateUpdatedAt).toEqual(
        new Date("2024-04-10T12:52:56-08:00"),
      );
    });

    it("should return 200 if overwriting existing item with different URL", async () => {
      await testDb.db.insert(items).values({
        id: TEST_ITEM_ID_1,
        url: TEST_ITEM_URL_1,
        slug: "example-com-123456",
        createdAt: new Date("2025-01-10T12:52:56-08:00"),
        updatedAt: new Date("2025-01-10T12:52:56-08:00"),
      });
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID_1,
        title: "Old title",
        author: "Kim",
        state: ItemState.ACTIVE,
        isFavorite: false,
        stateUpdatedAt: new Date("2025-04-10T12:52:56-08:00"),
        savedAt: new Date("2025-01-01T00:00:00.000Z"),
        lastReadAt: null,
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com?query=value",
              metadata: {
                title: "My title",
                description: "My description",
                publishedAt: new Date("2024-01-01"),
              },
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        items: [
          expect.objectContaining({
            url: TEST_ITEM_URL_1,
            id: expect.any(String),
            slug: expect.stringMatching(/^example-com-[a-f0-9]{6}$/),
            metadata: expect.objectContaining({
              title: "My title",
              description: "My description",
              publishedAt: "2024-01-01T00:00:00.000Z",
              savedAt: "2025-01-01T00:00:00.000Z",
              author: "Kim",
            }),
          }),
        ],
      });

      const request2: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com/",
              metadata: {
                author: "Kim2",
                description: "",
              },
            },
          ],
        },
      });

      const response2 = await POST(request2);
      expect(response2.status).toBe(200);

      const data2 = await response2.json();
      expect(data2).toEqual({
        items: [
          expect.objectContaining({
            url: TEST_ITEM_URL_1,
            id: expect.any(String),
            slug: expect.stringMatching(/^example-com-[a-f0-9]{6}$/),
            metadata: expect.objectContaining({
              title: "My title",
              author: "Kim2",
              description: "My description",
              publishedAt: "2024-01-01T00:00:00.000Z",
            }),
          }),
        ],
      });
    });

    it("should return 200 and leave existing title untouched", async () => {
      await testDb.db.insert(items).values({
        id: TEST_ITEM_ID_1,
        url: TEST_ITEM_URL_1,
        slug: "example-com-123456",
        createdAt: new Date("2025-01-10T12:52:56-08:00"),
        updatedAt: new Date("2025-01-10T12:52:56-08:00"),
      });
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID_1,
        title: "Old title",
        author: "Kim",
        state: ItemState.ACTIVE,
        isFavorite: false,
        stateUpdatedAt: new Date("2025-04-10T12:52:56-08:00"),
        savedAt: new Date("2025-01-01T00:00:00.000Z"),
        lastReadAt: null,
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com?query=value",
              metadata: {
                description: "My description",
                publishedAt: new Date("2024-01-01"),
              },
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        items: [
          expect.objectContaining({
            url: TEST_ITEM_URL_1,
            id: expect.any(String),
            slug: expect.stringMatching(/^example-com-[a-f0-9]{6}$/),
            metadata: expect.objectContaining({
              title: "Old title",
              description: "My description",
              publishedAt: "2024-01-01T00:00:00.000Z",
              savedAt: "2025-01-01T00:00:00.000Z",
            }),
          }),
        ],
      });

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(
          and(
            eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID),
            eq(profileItems.itemId, TEST_ITEM_ID_1),
          ),
        );
      expect(updatedItems).toHaveLength(1);
      expect(updatedItems[0].state).toBe(ItemState.ACTIVE);
      expect(updatedItems[0].stateUpdatedAt).not.toBe(
        new Date("2025-04-10T12:52:56-08:00"),
      );
    });

    it("should return 200 if recreating item that has been deleted", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[3]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[3]);

      const currentItems = await testDb.db
        .select()
        .from(profileItems)
        .where(
          and(
            eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID),
            eq(profileItems.itemId, TEST_ITEM_ID_DELETED),
          ),
        );

      expect(currentItems).toHaveLength(1);
      expect(currentItems[0].state).toBe(ItemState.DELETED);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example4.com",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(
          and(
            eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID),
            eq(profileItems.itemId, TEST_ITEM_ID_DELETED),
          ),
        );

      expect(updatedItems).toHaveLength(1);
      expect(updatedItems[0].state).toBe(ItemState.ACTIVE);
      expect(updatedItems[0].stateUpdatedAt).toBeInstanceOf(Date);
      expect(
        MOCK_PROFILE_ITEMS[3].stateUpdatedAt &&
          (updatedItems[0].stateUpdatedAt as Date).getTime() >
            MOCK_PROFILE_ITEMS[3].stateUpdatedAt.getTime(),
      ).toBe(true);
    });

    it("should return 200 with unique stateUpdatedAt for bulk item insert", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS.slice(0, 2));
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com",
            },
            {
              url: "https://example2.com",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(and(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID)))
        .orderBy(profileItems.itemId);

      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].state).toBe(ItemState.ACTIVE);
      expect(updatedItems[0].stateUpdatedAt.toISOString()).not.toEqual(
        updatedItems[1].stateUpdatedAt.toISOString(),
      );
    });

    it("should return 200 with unique stateUpdatedAt for bulk item update", async () => {
      await testDb.db.insert(items).values([MOCK_ITEMS[0], MOCK_ITEMS[2]]);
      await testDb.db
        .insert(profileItems)
        .values([MOCK_PROFILE_ITEMS[0], MOCK_PROFILE_ITEMS[2]]);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com",
            },
            {
              url: "https://example3.com",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(and(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID)))
        .orderBy(profileItems.itemId);

      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].state).toBe(ItemState.ACTIVE);
      expect(updatedItems[0].stateUpdatedAt.toISOString()).not.toEqual(
        updatedItems[1].stateUpdatedAt.toISOString(),
      );
    });
    it("should return 200 and use provided stateUpdatedAt", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS.slice(0, 2));
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com",
              metadata: {
                stateUpdatedAt: new Date("2024-01-01"),
              },
            },
            {
              url: "https://example2.com",
              metadata: {
                stateUpdatedAt: new Date("2024-01-01"),
              },
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(and(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID)))
        .orderBy(profileItems.itemId);

      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].state).toBe(ItemState.ACTIVE);
      expect(updatedItems[0].stateUpdatedAt.toISOString()).toEqual(
        "2024-01-01T00:00:00.000Z",
      );
      expect(updatedItems[1].state).toBe(ItemState.ACTIVE);
      expect(updatedItems[1].stateUpdatedAt.toISOString()).toEqual(
        "2024-01-01T00:00:00.000Z",
      );
    });

    it("should return 400 if request body is invalid", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 if request body includes slugs", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "http://example.com",
              slug: "test-slug",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 if request body includes non-url thumbnail", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com",
              metadata: {
                thumbnail: "hello",
              },
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 if request body includes non-url favicon", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com",
              metadata: {
                favicon: "./assets/favicon.png",
              },
            },
          ],
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
          items: [
            {
              url: "https://example.com",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 401 if no valid auth is provided", async () => {
      const request: APIRequest = makeUnauthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 500 if database error occurs", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          items: [
            {
              url: "https://example.com",
            },
          ],
        },
      });

      type PgTx = Parameters<Parameters<typeof testDb.db.transaction>[0]>[0];

      vi.spyOn(testDb.db, "transaction").mockImplementationOnce(
        async (callback) => {
          return callback({
            ...testDb.db,
            insert: () => {
              throw { code: DbErrorCode.UniqueViolation };
            },
          } as unknown as PgTx);
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
