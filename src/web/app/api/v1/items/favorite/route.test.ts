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

import { POST } from "./route";

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_URL_1 = "https://example.com/";
const TEST_ITEM_ID_2 = "123e4567-e89b-12d3-a456-426614174000";
const TEST_ITEM_URL_2 = "https://example2.com/";
const TEST_ITEM_ID_3 = "123e4567-e89b-12d3-a456-426614174003";
const TEST_ITEM_URL_3 = "https://example3.com/";
const NONEXISTENT_USER_ID = "123e4567-e89b-12d3-a456-426614174003";
const ORIGINAL_ARCHIVED_TIME = new Date("2025-01-10T12:52:56-08:00");

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
    favicon: "https://example.com/favicon1.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:00"),
    stateUpdatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_2,
    title: "Example 2",
    description: "Second example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb2.jpg",
    favicon: "https://example.com/favicon2.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:57-08:00"),
    stateUpdatedAt: new Date("2025-01-10T12:52:57-08:00"),
  },
  {
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_3,
    title: "Example 3",
    description: "Third example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb3.jpg",
    favicon: "https://example.com/favicon3.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:58-08:00"),
    stateUpdatedAt: new Date("2025-01-10T12:52:58-08:00"),
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
    favicon: "https://example.com/favicon3.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:04"),
    stateUpdatedAt: new Date("2025-01-10T12:52:56-08:04"),
  },
];

describe("POST /api/v1/items/favorite", () => {
  test.each([
    ["should return 200 favoriting items via regular auth", ""],
    ["should return 200 favoriting items via api key", DEFAULT_TEST_API_KEY],
  ])("%s", async (_, apiKey) => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: apiKey,
      body: {
        slugs: "example-com,example3-com",
        favorite: true,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      updated: [{ slug: "example-com" }, { slug: "example3-com" }],
    });

    const updatedItems = await testDb.db
      .select({
        id: items.id,
        slug: items.slug,
        state: profileItems.state,
        isFavorite: profileItems.isFavorite,
        profileId: profileItems.profileId,
      })
      .from(profileItems)
      .innerJoin(items, eq(items.id, profileItems.itemId))
      .where(eq(profileItems.isFavorite, true));

    expect(updatedItems).toHaveLength(2);

    expect(updatedItems).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        slug: "example-com",
        state: ItemState.ACTIVE,
        profileId: DEFAULT_TEST_PROFILE_ID,
        isFavorite: true,
      }),
      expect.objectContaining({
        id: expect.any(String),
        slug: "example3-com",
        state: ItemState.ACTIVE,
        profileId: DEFAULT_TEST_PROFILE_ID,
        isFavorite: true,
      }),
    ]);
  });

  it("should return 200 when unfavoriting items", async () => {
    await testDb.db.insert(items).values([MOCK_ITEMS[0], MOCK_ITEMS[1]]);
    await testDb.db.insert(profileItems).values([
      {
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID,
        title: "Old title",
        author: "Kim",
        state: ItemState.ARCHIVED,
        isFavorite: false,
        stateUpdatedAt: ORIGINAL_ARCHIVED_TIME,
        savedAt: new Date("2025-01-01T00:00:00.000Z"),
        lastReadAt: null,
      },
      {
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID_2,
        title: "Old title 2",
        author: "Kim",
        state: ItemState.ARCHIVED,
        isFavorite: true,
        stateUpdatedAt: ORIGINAL_ARCHIVED_TIME,
        savedAt: new Date("2025-01-01T00:00:00.000Z"),
        lastReadAt: null,
      },
    ]);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        slugs: "example-com, example2-com",
        favorite: false,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      updated: [{ slug: "example2-com" }, { slug: "example-com" }],
    });

    const updatedItems = await testDb.db
      .select()
      .from(profileItems)
      .where(eq(profileItems.isFavorite, false));

    expect(updatedItems).toHaveLength(2);
  });

  it("should return 200 if request body includes invalid slugs", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        slugs: "test-slug",
        favorite: false,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("should return 400 if slugs are missing", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        slugs: "",
        favorite: false,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 if favorite is missing", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        slugs: "example-com",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 if favorite is invalid", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        slugs: "example-com",
        favorite: "invalid-favorite",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 401 if user profile not found", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      userId: NONEXISTENT_USER_ID,
      body: {
        slugs: "example-com",
        favorite: true,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const updatedItems = await testDb.db
      .select()
      .from(profileItems)
      .where(eq(profileItems.isFavorite, true));
    expect(updatedItems).toHaveLength(0);
  });

  it("should return 401 if no valid auth is provided", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeUnauthenticatedMockRequest({
      method: "POST",
      body: {
        slugs: ["example-com"],
        favorite: false,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if invalid api key is provided", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: "invalid-api-key",
      body: {
        slugs: ["example-com"],
        favorite: false,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 500 if database error occurs", async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        slugs: "example-com",
        favorite: false,
      },
    });

    jest.spyOn(testDb.db, "update").mockImplementationOnce(() => {
      throw { code: DbErrorCode.ConnectionFailure };
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
