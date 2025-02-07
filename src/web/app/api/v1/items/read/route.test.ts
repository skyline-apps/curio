import { jest } from "@jest/globals";

import {
  getItemContent,
  MOCK_VERSION,
  storage,
  StorageError,
} from "@/__mocks__/storage";
import { eq } from "@/db";
import { items, ItemState, profileItems } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { POST } from "./route";

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_SLUG = "example-com";
const TEST_ITEM_URL = "https://example.com";
const NONEXISTENT_USER_ID = "123e4567-e89b-12d3-a456-426614174003";
const ORIGINAL_PUBLISHED_DATE = new Date("2024-01-10T12:50:00-08:00");
const ORIGINAL_CREATION_DATE = new Date("2025-01-10T12:52:56-08:00");
const MOCK_ITEM = {
  id: TEST_ITEM_ID,
  url: TEST_ITEM_URL,
  slug: TEST_ITEM_SLUG,
  createdAt: ORIGINAL_CREATION_DATE,
  updatedAt: ORIGINAL_CREATION_DATE,
};

describe("POST /api/v1/items/read", () => {
  test.each([
    ["should return 200 when reading version name via regular auth", ""],
    [
      "should return 200 when reading version name via api key",
      DEFAULT_TEST_API_KEY,
    ],
  ])("%s", async (_, apiKey) => {
    await testDb.db.insert(items).values(MOCK_ITEM);
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      title: "Example",
      description: "An example item",
      author: "Test Author",
      thumbnail: "https://example.com/thumb.jpg",
      favicon: "https://example.com/favicon.ico",
      publishedAt: ORIGINAL_PUBLISHED_DATE,
      savedAt: ORIGINAL_CREATION_DATE,
      stateUpdatedAt: ORIGINAL_CREATION_DATE,
      isFavorite: true,
      versionName: MOCK_VERSION,
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey,
      body: { slug: TEST_ITEM_SLUG, readingProgress: 50 },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      slug: TEST_ITEM_SLUG,
      readingProgress: 50,
      versionName: MOCK_VERSION,
    });
    expect(storage.getItemMetadata).not.toHaveBeenCalled();

    const updatedItem = await testDb.db
      .select()
      .from(profileItems)
      .where(eq(profileItems.itemId, TEST_ITEM_ID))
      .limit(1)
      .execute();

    expect(updatedItem[0].versionName).toBe(MOCK_VERSION);
    expect(updatedItem[0].readingProgress).toBe(50);
  });

  it("should return 200 and update version name when default is set", async () => {
    jest.mocked(getItemContent).mockResolvedValueOnce({
      version: "2010-04-04",
      content: "custom version content",
    });
    await testDb.db.insert(items).values(MOCK_ITEM);
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      title: "Example",
      description: "An example item",
      author: "Test Author",
      thumbnail: "https://example.com/thumb.jpg",
      favicon: "https://example.com/favicon.ico",
      publishedAt: ORIGINAL_PUBLISHED_DATE,
      savedAt: ORIGINAL_CREATION_DATE,
      stateUpdatedAt: ORIGINAL_CREATION_DATE,
      state: ItemState.ACTIVE,
      isFavorite: true,
      readingProgress: 5,
      lastReadAt: new Date("2025-02-10T12:50:00-08:00"),
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { slug: TEST_ITEM_SLUG, readingProgress: 24 },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      slug: TEST_ITEM_SLUG,
      readingProgress: 24,
      versionName: MOCK_VERSION,
    });
    expect(storage.getItemMetadata).toHaveBeenCalledTimes(1);
    expect(storage.getItemMetadata).toHaveBeenCalledWith(TEST_ITEM_SLUG);

    const updatedItem = await testDb.db
      .select()
      .from(profileItems)
      .where(eq(profileItems.itemId, TEST_ITEM_ID))
      .limit(1)
      .execute();

    expect(updatedItem[0].versionName).toBe(MOCK_VERSION);
  });

  it("should return 401 if user profile not found", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      userId: NONEXISTENT_USER_ID,
      body: { slug: TEST_ITEM_SLUG, readingProgress: 24 },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if invalid api key provided", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: "invalid-api-key",
      body: { slug: TEST_ITEM_SLUG, readingProgress: 24 },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 404 if item not found", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { slug: "nonexistent", readingProgress: 24 },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Item not found.");
  });

  it("should return 400 if slug is missing", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { slug: "", readingProgress: 24 },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No slug provided.");
  });

  it("should return 500 if fails to fetch storage metadata", async () => {
    jest
      .mocked(storage.getItemMetadata)
      .mockRejectedValueOnce(
        new StorageError("Failed to verify metadata contents"),
      );
    await testDb.db.insert(items).values(MOCK_ITEM);
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      title: "Example",
      description: "An example item",
      author: "Test Author",
      thumbnail: "https://example.com/thumb.jpg",
      favicon: "https://example.com/favicon.ico",
      publishedAt: ORIGINAL_PUBLISHED_DATE,
      savedAt: ORIGINAL_CREATION_DATE,
      stateUpdatedAt: ORIGINAL_CREATION_DATE,
      state: ItemState.ACTIVE,
      isFavorite: true,
      readingProgress: 5,
      lastReadAt: new Date("2025-02-10T12:50:00-08:00"),
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: { slug: TEST_ITEM_SLUG, readingProgress: 24 },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Error reading item.");
  });
});
