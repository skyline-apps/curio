import { eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import { items, ItemState, profileItems } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { GET, POST } from "./route";

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_URL_1 = "https://example.com/";
const TEST_ITEM_ID_2 = "123e4567-e89b-12d3-a456-426614174000";
const TEST_ITEM_URL_2 = "https://example2.com/";
const TEST_ITEM_ID_3 = "123e4567-e89b-12d3-a456-426614174003";
const TEST_ITEM_URL_3 = "https://example3.com/";
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
];

const MOCK_PROFILE_ITEMS = [
  {
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID,
    title: "Example 1",
    description: "First example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb1.jpg",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_2,
    title: "Example 2",
    description: "Second example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb2.jpg",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:57-08:00"),
  },
  {
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_3,
    title: "Example 3",
    description: "Third example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb3.jpg",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:58-08:00"),
    state: ItemState.ACTIVE,
    isFavorite: false,
    readingProgress: 10,
    lastReadAt: new Date("2025-01-15T12:00:00-08:00"),
    versionName: "2024-01-01",
  },
  {
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    itemId: TEST_ITEM_ID_3,
    title: "Example 3 New title",
    description: "Third example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb3.jpg",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:04"),
  },
];

describe("GET /api/v1/items", () => {
  test.each([
    ["should return 200 with the user's items via regular auth", ""],
    [
      "should return 200 with the user's items via api key",
      DEFAULT_TEST_API_KEY,
    ],
  ])("%s", async (_, apiKey) => {
    await testDb.db.insert(items).values(MOCK_ITEMS[0]);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      apiKey: apiKey,
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe(TEST_ITEM_ID);
    expect(data.total).toBe(1);
    expect(data.items[0].metadata).toEqual({
      author: "Test Author",
      description: "First example item",
      publishedAt: "2025-01-10T20:52:56.000Z",
      thumbnail: "https://example.com/thumb1.jpg",
      title: "Example 1",
      savedAt: "2025-01-10T20:52:56.000Z",
      isFavorite: false,
      lastReadAt: null,
      readingProgress: 0,
      state: ItemState.ACTIVE,
      versionName: null,
    });
  });

  it("should support cursor-based pagination", async () => {
    // Create multiple test items with different IDs to test pagination
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
      MOCK_PROFILE_ITEMS[1].savedAt.toISOString(),
    );
    expect(firstData.items[0].id).toBe(TEST_ITEM_ID_3); // Most recent first
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
    expect(secondData.items[0].id).toBe(TEST_ITEM_ID); // Last item
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
    expect(data.items[0].id).toBe(TEST_ITEM_ID_2);
    expect(data.items[1].id).toBe(TEST_ITEM_ID);
    expect(data.total).toBe(3);
  });

  it("should return 200 when fetching specific urls", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

    const params = new URLSearchParams({
      urls: "https://example2.com?query=val,https://example3.com",
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
    expect(data.items[0].metadata.versionName).toBe("2024-01-01");
    expect(data.items[0].metadata.lastReadAt).toBe("2025-01-15T20:00:00.000Z");
    expect(data.items[0].metadata.isFavorite).toBe(false);
    expect(data.items[0].metadata.readingProgress).toBe(10);
    expect(data.items[0].metadata.state).toBe(ItemState.ACTIVE);
    expect(data.items[1].id).toBe(TEST_ITEM_ID_2);
    expect(data.items[1].metadata.versionName).toBe(null);
    expect(data.items[1].metadata.lastReadAt).toBe(null);
    expect(data.items[1].metadata.isFavorite).toBe(false);
    expect(data.items[1].metadata.readingProgress).toBe(0);
    expect(data.items[1].metadata.state).toBe(ItemState.ACTIVE);
    expect(data.total).toBe(3);
  });

  it("should return 400 when both slugs and urls are provided", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

    const params = new URLSearchParams({
      slugs: "example-com,example2-com",
      urls: "https://example2.com?query=val,https://example3.com",
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

  it("should return 401 when invalid api key is provided", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      apiKey: "invalid-api-key",
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe("POST /api/v1/items", () => {
  test.each([
    ["should return 200 creating untitled item via regular auth", ""],
    [
      "should return 200 creating untitled item via api key",
      DEFAULT_TEST_API_KEY,
    ],
  ])("%s", async (_, apiKey) => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: apiKey,
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
          slug: expect.stringMatching(/^example-com-[a-f0-9]{6}$/),
          metadata: expect.objectContaining({
            title: "https://example.com/",
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
        title: "https://example.com/",
        isFavorite: false,
        stateUpdatedAt: null,
        lastReadAt: null,
        savedAt: null,
      }),
    ]);
  });

  test.each([
    ["should return 200 updating item via regular auth", ""],
    ["should return 200 updating item via api key", DEFAULT_TEST_API_KEY],
  ])("%s", async (_, apiKey) => {
    await testDb.db.insert(items).values({
      id: TEST_ITEM_ID,
      url: TEST_ITEM_URL_1,
      slug: "example-com-123456",
      createdAt: new Date("2025-01-10T12:52:56-08:00"),
      updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    });
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      title: "Old title",
      author: "Kim",
      savedAt: new Date("2024-01-10T12:52:56-08:00"),
      state: ItemState.ACTIVE,
      isFavorite: false,
      stateUpdatedAt: null,
      lastReadAt: null,
    });
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: apiKey,
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
          url: "https://example.com/",
          id: expect.any(String),
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
          url: "https://example2.com/",
          id: expect.any(String),
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
      .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID));

    expect(savedItems.length).toBe(2);

    expect(savedItems).toEqual([
      expect.objectContaining({
        itemId: TEST_ITEM_ID,
        state: ItemState.ACTIVE,
        title: "New title",
        description: "New description",
        author: "Kim",
        isFavorite: false,
        stateUpdatedAt: null,
        lastReadAt: null,
      }),
      expect.objectContaining({
        itemId: expect.any(String),
        state: ItemState.ACTIVE,
        title: "Example title",
        description: null,
        isFavorite: false,
        stateUpdatedAt: null,
        lastReadAt: null,
      }),
    ]);
  });

  it("should return 200 if overwriting existing item with different URL", async () => {
    await testDb.db.insert(items).values({
      id: TEST_ITEM_ID,
      url: TEST_ITEM_URL_1,
      slug: "example-com-123456",
      createdAt: new Date("2025-01-10T12:52:56-08:00"),
      updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    });
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      title: "Old title",
      author: "Kim",
      state: ItemState.ACTIVE,
      isFavorite: false,
      stateUpdatedAt: null,
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
          url: "https://example.com/",
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
            url: "https://example.com",
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
      id: TEST_ITEM_ID,
      url: TEST_ITEM_URL_1,
      slug: "example-com-123456",
      createdAt: new Date("2025-01-10T12:52:56-08:00"),
      updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    });
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      title: "Old title",
      author: "Kim",
      state: ItemState.ACTIVE,
      isFavorite: false,
      stateUpdatedAt: null,
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
          url: "https://example.com/",
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

  it("should return 401 if invalid api key is provided", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: "invalid-api-key",
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

    jest
      .spyOn(testDb.db, "transaction")
      .mockImplementationOnce(async (callback) => {
        return callback({
          ...testDb.db,
          insert: () => {
            throw { code: DbErrorCode.UniqueViolation };
          },
        } as unknown as PgTx);
      });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
