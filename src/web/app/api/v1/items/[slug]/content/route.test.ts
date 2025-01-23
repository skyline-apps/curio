import { jest } from "@jest/globals";

import { eq } from "@/db";
import { items, profileItems } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { GET, POST } from "./route";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Mock global fetch
const mockResponse = {
  ok: true,
  json: () => Promise.resolve({ data: { path: "test-path" } }),
  blob: () => Promise.resolve(new Blob(["test content"])),
} as Response;

global.fetch = jest.fn(() => Promise.resolve(mockResponse));

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_SLUG = "example-com";
const NONEXISTENT_USER_ID = "123e4567-e89b-12d3-a456-426614174003";

describe("GET /api/v1/items/[slug]/content", () => {
  test.each([
    ["should return 200 with item content via regular auth", ""],
    ["should return 200 with item content via api key", DEFAULT_TEST_API_KEY],
  ])("%s", async (_, apiKey) => {
    const mockItem = {
      id: TEST_ITEM_ID,
      url: "https://example.com",
      slug: TEST_ITEM_SLUG,
      title: "Example",
      description: "An example item",
      author: "Test Author",
      thumbnail: "https://example.com/thumb.jpg",
      publishedAt: new Date("2025-01-10T12:52:56-08:00"),
      createdAt: new Date("2025-01-10T12:52:56-08:00"),
      updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    };

    await testDb.db.insert(items).values(mockItem);
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      savedAt: new Date("2025-01-10T12:52:56-08:00"),
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      apiKey,
      searchParams: { slug: TEST_ITEM_SLUG },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      content: "test content",
      itemId: TEST_ITEM_ID,
    });
  });

  it("should return 401 if user profile not found", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      userId: NONEXISTENT_USER_ID,
      searchParams: { slug: TEST_ITEM_SLUG },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if invalid api key provided", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      apiKey: "invalid-api-key",
      searchParams: { slug: TEST_ITEM_SLUG },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should return 404 if item not found", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      searchParams: { slug: "nonexistent" },
    });

    const response = await GET(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Item not found.");
  });

  it("should return 404 if slug is missing", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      searchParams: { slug: "" },
    });

    const response = await GET(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Item not found.");
  });
});

describe("POST /api/v1/items/[slug]/content", () => {
  test.each([
    ["should return 200 when updating content via regular auth", ""],
    [
      "should return 200 when updating content via api key",
      DEFAULT_TEST_API_KEY,
    ],
  ])("%s", async (_, apiKey) => {
    const originalPublishedDate = new Date("2024-01-10T12:50:00-08:00");
    const originalCreationDate = new Date("2025-01-10T12:52:56-08:00");
    const mockItem = {
      id: TEST_ITEM_ID,
      url: "https://example.com",
      slug: TEST_ITEM_SLUG,
      title: "Example",
      description: "An example item",
      author: "Test Author",
      thumbnail: "https://example.com/thumb.jpg",
      publishedAt: originalPublishedDate,
      createdAt: originalCreationDate,
      updatedAt: originalCreationDate,
    };

    await testDb.db.insert(items).values(mockItem);
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      savedAt: originalCreationDate,
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey,
      body: {
        content: "Updated content",
        slug: TEST_ITEM_SLUG,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      itemId: TEST_ITEM_ID,
      message: "Content updated and set as main version",
      status: "UPDATED_MAIN",
    });

    const updatedItem = await testDb.db
      .select()
      .from(items)
      .where(eq(items.id, TEST_ITEM_ID))
      .limit(1);
    expect(
      (updatedItem[0].updatedAt as Date).getTime() >
        originalCreationDate.getTime(),
    ).toBe(true);
    expect((updatedItem[0].createdAt as Date).getTime()).toEqual(
      originalCreationDate.getTime(),
    );

    const updatedProfileItem = await testDb.db
      .select()
      .from(profileItems)
      .where(eq(profileItems.itemId, TEST_ITEM_ID))
      .limit(1);
    expect(
      updatedProfileItem[0].savedAt.getTime() > originalCreationDate.getTime(),
    ).toBe(true);
  });

  it("should return 401 if user profile not found", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      userId: NONEXISTENT_USER_ID,
      body: {
        content: "Updated content",
        slug: TEST_ITEM_SLUG,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 401 if invalid api key provided", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: "invalid-api-key",
      body: {
        content: "Updated content",
        slug: TEST_ITEM_SLUG,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 404 if item not found", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        content: "Updated content",
        slug: "nonexistent",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Item not found.");
  });

  it("should return 404 if slug is missing", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        content: "Updated content",
        slug: "",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Item not found.");
  });

  it("should return 400 if content is missing", async () => {
    const mockItem = {
      id: TEST_ITEM_ID,
      url: "https://example.com",
      slug: TEST_ITEM_SLUG,
      title: "Example",
      description: "An example item",
      author: "Test Author",
      thumbnail: "https://example.com/thumb.jpg",
      publishedAt: new Date("2025-01-10T12:52:56-08:00"),
      createdAt: new Date("2025-01-10T12:52:56-08:00"),
      updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    };

    await testDb.db.insert(items).values(mockItem);
    await testDb.db.insert(profileItems).values({
      profileId: DEFAULT_TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      savedAt: new Date("2025-01-10T12:52:56-08:00"),
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      body: {
        slug: TEST_ITEM_SLUG,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request parameters:\ncontent: Required");
  });
});
