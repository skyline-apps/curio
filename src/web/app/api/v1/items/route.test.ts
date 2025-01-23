import { eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import { items, profileItems } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { GET, POST } from "./route";

const TEST_PROFILE_ID = "123e4567-e89b-12d3-a456-426614174000";
const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const NONEXISTENT_USER_ID = "123e4567-e89b-12d3-a456-426614174003";

describe("GET /api/v1/items", () => {
  test.each([
    ["should return 200 with the user's items via regular auth", ""],
    [
      "should return 200 with the user's items via api key",
      DEFAULT_TEST_API_KEY,
    ],
  ])("%s", async (_, apiKey) => {
    const mockItems = [
      {
        id: TEST_ITEM_ID,
        url: "https://example.com",
        slug: "example-com",
        title: "Example",
        description: "An example item",
        author: "Test Author",
        thumbnail: "https://example.com/thumb.jpg",
        publishedAt: new Date("2025-01-10T12:52:56-08:00"),
        createdAt: new Date("2025-01-10T12:52:56-08:00"),
        updatedAt: new Date("2025-01-10T12:52:56-08:00"),
      },
    ];

    await testDb.db.insert(items).values(mockItems);
    await testDb.db.insert(profileItems).values({
      profileId: TEST_PROFILE_ID,
      itemId: TEST_ITEM_ID,
      savedAt: new Date("2025-01-10T12:52:56-08:00"),
    });

    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      apiKey: apiKey,
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      items: [
        {
          id: TEST_ITEM_ID,
          url: "https://example.com",
          slug: "example-com",
          title: "Example",
          description: "An example item",
          author: "Test Author",
          thumbnail: "https://example.com/thumb.jpg",
          publishedAt: "2025-01-10T20:52:56.000Z",
          createdAt: "2025-01-10T20:52:56.000Z",
          updatedAt: "2025-01-10T20:52:56.000Z",
        },
      ],
      total: 1,
    });
  });

  it("should return 400 with default limit if limit is invalid", async () => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "GET",
      searchParams: {
        limit: "0",
      },
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
    ["should return 200 adding item via regular auth", ""],
    ["should return 200 adding item via api key", DEFAULT_TEST_API_KEY],
  ])("%s", async (_, apiKey) => {
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: apiKey,
      body: {
        items: [
          {
            url: "https://example.com",
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
          url: expect.stringMatching(/^https:\/\/example\.com\/?$/),
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
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
        isFavorite: false,
        archivedAt: null,
        lastReadAt: null,
      }),
    ]);
  });

  test.each([
    ["should return 200 updating item via regular auth", ""],
    ["should return 200 updating item via api key", DEFAULT_TEST_API_KEY],
  ])("%s", async (_, apiKey) => {
    await testDb.db.insert(items).values({
      id: TEST_ITEM_ID,
      url: "https://example.com",
      slug: "example-com",
      title: "Old title",
      createdAt: new Date("2025-01-10T12:52:56-08:00"),
      updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    });
    const request: APIRequest = makeAuthenticatedMockRequest({
      method: "POST",
      apiKey: apiKey,
      body: {
        items: [
          {
            url: "https://example.com",
            title: "New title",
            description: "New description",
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
          url: expect.stringMatching(/^https:\/\/example\.com\/?$/),
          id: expect.any(String),
          title: "New title",
          description: "New description",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
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
        isFavorite: false,
        archivedAt: null,
        lastReadAt: null,
      }),
    ]);
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

    jest.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
      throw { code: DbErrorCode.UniqueViolation };
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
