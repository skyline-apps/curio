import { eq } from "@web/db";
import { DbErrorCode } from "@web/db/errors";
import {
  items,
  ItemState,
  profileItemLabels,
  profileItems,
  profileLabels,
  profiles,
  TextDirection,
} from "@web/db/schema";
import { APIRequest } from "@web/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  DEFAULT_TEST_USERNAME,
  DEFAULT_TEST_USERNAME_2,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@web/utils/test/api";
import { testDb } from "@web/utils/test/provider";
import { vi } from "vitest";

import { GET } from "./route";

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_URL_1 = "https://example.com/";
const TEST_ITEM_ID_2 = "123e4567-e89b-12d3-a456-426614174002";
const TEST_ITEM_URL_2 = "https://example2.com/";
const TEST_ITEM_ID_3 = "123e4567-e89b-12d3-a456-426614174003";
const TEST_ITEM_URL_3 = "https://example3.com/";
const TEST_ITEM_ID_4 = "123e4567-e89b-12d3-a456-426614174004";
const TEST_ITEM_URL_4 = "https://example4.com/";
const TEST_LABEL_ID_1 = "123e4567-e89b-12d3-a456-426614174005";
const TEST_LABEL_ID_2 = "123e4567-e89b-12d3-a456-426614174006";

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
    id: TEST_ITEM_ID_4,
    url: TEST_ITEM_URL_4,
    slug: "example4-com",
    createdAt: new Date("2025-01-10T12:55:56-08:00"),
    updatedAt: new Date("2025-01-10T12:55:56-08:00"),
  },
];

const MOCK_PROFILE_ITEMS = [
  {
    id: "12345678-1234-1234-1234-123456789011",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID,
    title: "Example 1",
    description: "First example item",
    author: "Test Author",
    isFavorite: true,
    thumbnail: "https://example.com/thumb1.jpg",
    favicon: "https://example.com/favicon1.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:00"),
    stateUpdatedAt: new Date("2025-01-10T12:52:56-08:00"),
    textLanguage: "en",
  },
  {
    id: "12345678-1234-1234-1234-123456789012",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_2,
    title: "Example 2",
    description: "Second example item",
    author: "Test Author",
    isFavorite: true,
    thumbnail: "https://example.com/thumb2.jpg",
    favicon: "https://example.com/favicon2.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:57-08:00"),
    stateUpdatedAt: new Date("2025-01-10T12:52:57-08:00"),
    state: ItemState.ARCHIVED,
    textLanguage: "en",
  },
  {
    id: "12345678-1234-1234-1234-123456789013",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_3,
    title: "Example 3",
    description: "Third example item",
    author: "Test Author",
    isFavorite: false,
    thumbnail: "https://example.com/thumb3.jpg",
    favicon: "https://example.com/favicon3.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:58-08:00"),
    stateUpdatedAt: new Date("2025-01-10T12:52:58-08:00"),
    state: ItemState.ACTIVE,
    readingProgress: 10,
    lastReadAt: new Date("2025-01-15T12:00:00-08:00"),
    versionName: "2024-01-01",
    textLanguage: "en",
  },
  {
    id: "12345678-1234-1234-1234-123456789014",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_4,
    title: "Example 4",
    description: "Fourth example item",
    author: "Test Author",
    isFavorite: true,
    thumbnail: "https://example.com/thumb4.jpg",
    favicon: "https://example.com/favicon4.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:04"),
    stateUpdatedAt: new Date("2025-01-10T12:52:59-08:00"),
    state: ItemState.ACTIVE,
    readingProgress: 15,
    lastReadAt: new Date("2025-01-15T12:00:00-08:00"),
    versionName: "2024-01-01",
    textLanguage: "en",
  },
  {
    id: "12345678-1234-1234-1234-123456789015",
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    itemId: TEST_ITEM_ID_3,
    title: "Example 3 New title",
    description: "Third example item",
    author: "Test Author",
    isFavorite: true,
    thumbnail: "https://example.com/thumb3.jpg",
    favicon: "https://example.com/favicon3.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:04"),
    stateUpdatedAt: new Date("2025-01-10T12:53:00-08:00"),
    textLanguage: "en",
  },
];

const MOCK_LABELS = [
  {
    id: TEST_LABEL_ID_1,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Test Label 1",
    color: "#ff0000",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: TEST_LABEL_ID_2,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Test Label 2",
    color: "#00ff00",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
];

const MOCK_PROFILE_ITEM_LABELS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174007",
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    labelId: TEST_LABEL_ID_1,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174008",
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    labelId: TEST_LABEL_ID_2,
  },
];

describe("/api/v1/profile", () => {
  describe("GET /api/v1/profile", () => {
    beforeEach(async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);
    });

    it("should return 200 when viewing own profile", async () => {
      const params = new URLSearchParams({
        username: DEFAULT_TEST_USERNAME,
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/profile?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.profile).toEqual({
        username: DEFAULT_TEST_USERNAME,
        createdAt: "2025-01-10T20:52:56.000Z",
      });
      expect(body.favoriteItems).toHaveLength(3);
      expect(body.favoriteItems).toEqual([
        {
          createdAt: "2025-01-10T20:55:56.000Z",
          id: TEST_ITEM_ID_4,
          labels: [],
          metadata: {
            author: "Test Author",
            description: "Fourth example item",
            favicon: "https://example.com/favicon4.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb4.jpg",
            textDirection: TextDirection.LTR,
            textLanguage: "en",
            title: "Example 4",
            savedAt: "2025-01-10T20:56:56.000Z",
            isFavorite: true,
            readingProgress: 15,
            state: ItemState.ACTIVE,
            source: null,
            stateUpdatedAt: "2025-01-10T20:52:59.000Z",
            versionName: "2024-01-01",
            lastReadAt: "2025-01-15T20:00:00.000Z",
          },
          profileItemId: MOCK_PROFILE_ITEMS[3].id,
          slug: "example4-com",
          url: TEST_ITEM_URL_4,
        },
        {
          createdAt: "2025-01-10T20:53:56.000Z",
          id: TEST_ITEM_ID_2,
          labels: [],
          metadata: {
            author: "Test Author",
            description: "Second example item",
            favicon: "https://example.com/favicon2.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb2.jpg",
            textDirection: TextDirection.LTR,
            textLanguage: "en",
            title: "Example 2",
            savedAt: "2025-01-10T20:52:57.000Z",
            isFavorite: true,
            readingProgress: 0,
            state: ItemState.ARCHIVED,
            source: null,
            stateUpdatedAt: "2025-01-10T20:52:57.000Z",
            versionName: null,
            lastReadAt: null,
          },
          profileItemId: MOCK_PROFILE_ITEMS[1].id,
          slug: "example2-com",
          url: TEST_ITEM_URL_2,
        },
        {
          createdAt: "2025-01-10T20:52:56.000Z",
          id: TEST_ITEM_ID,
          labels: [
            {
              color: "#ff0000",
              id: "123e4567-e89b-12d3-a456-426614174005",
              name: "Test Label 1",
            },
            {
              color: "#00ff00",
              id: "123e4567-e89b-12d3-a456-426614174006",
              name: "Test Label 2",
            },
          ],
          metadata: {
            author: "Test Author",
            description: "First example item",
            favicon: "https://example.com/favicon1.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb1.jpg",
            textDirection: TextDirection.LTR,
            textLanguage: "en",
            title: "Example 1",
            savedAt: "2025-01-10T20:52:56.000Z",
            isFavorite: true,
            readingProgress: 0,
            state: ItemState.ACTIVE,
            source: null,
            stateUpdatedAt: "2025-01-10T20:52:56.000Z",
            versionName: null,
            lastReadAt: null,
          },
          profileItemId: MOCK_PROFILE_ITEMS[0].id,
          slug: "example-com",
          url: TEST_ITEM_URL_1,
        },
      ]);
    });

    it("should return 200 with paginated results", async () => {
      const params = new URLSearchParams({
        username: DEFAULT_TEST_USERNAME,
        limit: "2",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/profile?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.profile).toEqual({
        username: DEFAULT_TEST_USERNAME,
        createdAt: "2025-01-10T20:52:56.000Z",
      });
      expect(body.favoriteItems).toHaveLength(2);
      expect(body.nextCursor).toBe("2025-01-10T20:52:57.000Z");
      expect(body.favoriteItems).toEqual([
        {
          createdAt: "2025-01-10T20:55:56.000Z",
          id: TEST_ITEM_ID_4,
          labels: [],
          metadata: expect.objectContaining({
            author: "Test Author",
            description: "Fourth example item",
            favicon: "https://example.com/favicon4.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb4.jpg",
            title: "Example 4",
            savedAt: "2025-01-10T20:56:56.000Z",
          }),
          profileItemId: MOCK_PROFILE_ITEMS[3].id,
          slug: "example4-com",
          url: TEST_ITEM_URL_4,
        },
        {
          createdAt: "2025-01-10T20:53:56.000Z",
          id: TEST_ITEM_ID_2,
          labels: [],
          metadata: expect.objectContaining({
            author: "Test Author",
            description: "Second example item",
            favicon: "https://example.com/favicon2.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb2.jpg",
            title: "Example 2",
            savedAt: "2025-01-10T20:52:57.000Z",
          }),
          profileItemId: MOCK_PROFILE_ITEMS[1].id,
          slug: "example2-com",
          url: TEST_ITEM_URL_2,
        },
      ]);

      const params2 = new URLSearchParams({
        username: DEFAULT_TEST_USERNAME,
        limit: "2",
        cursor: body.nextCursor,
      });
      const request2: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/profile?${params2.toString()}`,
      });

      const response2 = await GET(request2);
      expect(response2.status).toBe(200);

      const body2 = await response2.json();
      expect(body2.profile).toEqual({
        username: DEFAULT_TEST_USERNAME,
        createdAt: "2025-01-10T20:52:56.000Z",
      });
      expect(body2.nextCursor).toBe(undefined);
      expect(body2.favoriteItems).toEqual([
        {
          createdAt: "2025-01-10T20:52:56.000Z",
          id: TEST_ITEM_ID,
          labels: [
            {
              color: "#ff0000",
              id: "123e4567-e89b-12d3-a456-426614174005",
              name: "Test Label 1",
            },
            {
              color: "#00ff00",
              id: "123e4567-e89b-12d3-a456-426614174006",
              name: "Test Label 2",
            },
          ],
          metadata: expect.objectContaining({
            author: "Test Author",
            description: "First example item",
            favicon: "https://example.com/favicon1.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb1.jpg",
            title: "Example 1",
            savedAt: "2025-01-10T20:52:56.000Z",
          }),
          profileItemId: MOCK_PROFILE_ITEMS[0].id,
          slug: "example-com",
          url: TEST_ITEM_URL_1,
        },
      ]);
    });

    it("should return 200 when viewing public profile", async () => {
      await testDb.db
        .update(profiles)
        .set({ public: true })
        .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
      const params = new URLSearchParams({
        username: DEFAULT_TEST_USERNAME,
      });
      const request: APIRequest = makeUnauthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/profile?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.profile).toEqual({
        username: DEFAULT_TEST_USERNAME,
        createdAt: "2025-01-10T20:52:56.000Z",
      });
      expect(body.favoriteItems).toHaveLength(3);
      expect(body.favoriteItems).toEqual([
        {
          createdAt: "2025-01-10T20:55:56.000Z",
          id: TEST_ITEM_ID_4,
          labels: [],
          metadata: {
            author: "Test Author",
            description: "Fourth example item",
            favicon: "https://example.com/favicon4.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb4.jpg",
            title: "Example 4",
            textDirection: TextDirection.LTR,
            textLanguage: "en",
            savedAt: "2025-01-10T20:56:56.000Z",
          },
          profileItemId: null,
          slug: "example4-com",
          url: TEST_ITEM_URL_4,
        },
        {
          createdAt: "2025-01-10T20:53:56.000Z",
          id: TEST_ITEM_ID_2,
          labels: [],
          metadata: {
            author: "Test Author",
            description: "Second example item",
            favicon: "https://example.com/favicon2.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb2.jpg",
            title: "Example 2",
            textDirection: TextDirection.LTR,
            textLanguage: "en",
            savedAt: "2025-01-10T20:52:57.000Z",
          },
          profileItemId: null,
          slug: "example2-com",
          url: TEST_ITEM_URL_2,
        },
        {
          createdAt: "2025-01-10T20:52:56.000Z",
          id: TEST_ITEM_ID,
          labels: [],
          metadata: {
            author: "Test Author",
            description: "First example item",
            favicon: "https://example.com/favicon1.ico",
            publishedAt: "2025-01-10T20:52:56.000Z",
            thumbnail: "https://example.com/thumb1.jpg",
            title: "Example 1",
            textDirection: TextDirection.LTR,
            textLanguage: "en",
            savedAt: "2025-01-10T20:52:56.000Z",
          },
          profileItemId: null,
          slug: "example-com",
          url: TEST_ITEM_URL_1,
        },
      ]);
    });

    it("should return 404 if user is private", async () => {
      await testDb.db
        .update(profiles)
        .set({ public: false })
        .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID_2));
      const params = new URLSearchParams({
        username: DEFAULT_TEST_USERNAME_2,
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/profile?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(404);
    });

    it("should return 404 if user does not exist", async () => {
      const params = new URLSearchParams({
        username: "fakeuser",
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/profile?${params.toString()}`,
      });

      const response = await GET(request);
      expect(response.status).toBe(404);
    });

    it("should return 500 if database error occurs", async () => {
      const params = new URLSearchParams({
        username: DEFAULT_TEST_USERNAME,
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        url: `http://localhost:3000/api/v1/profile?${params.toString()}`,
      });

      vi.spyOn(testDb.db, "select").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });
});
