import { jest } from "@jest/globals";

import { MOCK_METADATA } from "@/__mocks__/extract";
import {
  getItemContent,
  storage,
  StorageError,
  uploadItemContent,
} from "@/__mocks__/storage";
import { UploadStatus } from "@/app/api/v1/items/content/validation";
import { desc, eq } from "@/db";
import {
  items,
  ItemState,
  profileItemHighlights,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  ExtractError,
  extractMainContentAsMarkdown,
  extractMetadata,
  MetadataError,
} from "@/utils/extract";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { GET, POST } from "./route";

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_SLUG = "example-com";
const TEST_ITEM_URL = "https://example.com";
const NONEXISTENT_USER_ID = "123e4567-e89b-12d3-a456-426614174003";
const ORIGINAL_PUBLISHED_DATE = new Date("2024-01-10T12:50:00-08:00");
const ORIGINAL_CREATION_DATE = new Date("2025-01-10T12:52:56-08:00");
const TEST_LABEL_ID_1 = "123e4567-e89b-12d3-a456-426614174005";
const TEST_LABEL_ID_2 = "123e4567-e89b-12d3-a456-426614174006";

const MOCK_ITEM = {
  id: TEST_ITEM_ID,
  url: TEST_ITEM_URL,
  slug: TEST_ITEM_SLUG,
  createdAt: ORIGINAL_CREATION_DATE,
  updatedAt: ORIGINAL_CREATION_DATE,
};

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

const MOCK_PROFILE_ITEM = {
  id: "123e4567-e89b-12d3-a456-426614174999",
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
};

const MOCK_PROFILE_ITEM_LABELS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174007",
    profileItemId: MOCK_PROFILE_ITEM.id,
    labelId: TEST_LABEL_ID_1,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174008",
    profileItemId: MOCK_PROFILE_ITEM.id,
    labelId: TEST_LABEL_ID_2,
  },
];

const MOCK_HIGHLIGHTS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174010",
    profileItemId: MOCK_PROFILE_ITEM.id,
    startOffset: 10,
    endOffset: 20,
    text: "highlighted text",
    note: "test note",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174011",
    profileItemId: MOCK_PROFILE_ITEM.id,
    startOffset: 30,
    endOffset: 40,
    text: "another highlight",
    note: null,
    createdAt: new Date("2025-01-10T12:53:56-08:00"),
    updatedAt: new Date("2025-01-10T12:53:56-08:00"),
  },
];

describe("/api/v1/items/content", () => {
  describe("GET /api/v1/items/content", () => {
    test.each([
      ["should return 200 with item default content via regular auth", ""],
      [
        "should return 200 with item default content via api key",
        DEFAULT_TEST_API_KEY,
      ],
    ])("%s", async (_, apiKey) => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

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
        item: {
          id: TEST_ITEM_ID,
          slug: TEST_ITEM_SLUG,
          createdAt: ORIGINAL_CREATION_DATE.toISOString(),
          labels: [],
          highlights: [],
          metadata: {
            author: "Test Author",
            description: "An example item",
            publishedAt: ORIGINAL_PUBLISHED_DATE.toISOString(),
            thumbnail: "https://example.com/thumb.jpg",
            favicon: "https://example.com/favicon.ico",
            title: "Example",
            savedAt: ORIGINAL_CREATION_DATE.toISOString(),
            isFavorite: true,
            state: ItemState.ACTIVE,
            versionName: null,
            lastReadAt: null,
            readingProgress: 0,
          },
          url: TEST_ITEM_URL,
        },
      });
      expect(storage.getItemContent).toHaveBeenCalledTimes(1);
      expect(storage.getItemContent).toHaveBeenCalledWith(TEST_ITEM_SLUG, null);

      const updatedItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .limit(1)
        .execute();

      expect(updatedItem[0].versionName).toBe(null);
    });

    it("should return 200 with item and its labels", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        searchParams: { slug: TEST_ITEM_SLUG },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.item.labels).toEqual([
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
    });

    it("should return 200 with custom version content", async () => {
      jest.mocked(getItemContent).mockResolvedValueOnce({
        version: "2010-04-04",
        content: "custom version content",
      });
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEM,
        readingProgress: 5,
        lastReadAt: new Date("2025-02-10T20:50:00.000Z"),
        versionName: "2010-04-04",
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        searchParams: { slug: TEST_ITEM_SLUG },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        content: "custom version content",
        item: {
          id: TEST_ITEM_ID,
          slug: TEST_ITEM_SLUG,
          createdAt: ORIGINAL_CREATION_DATE.toISOString(),
          labels: [],
          highlights: [],
          metadata: {
            author: "Test Author",
            description: "An example item",
            publishedAt: ORIGINAL_PUBLISHED_DATE.toISOString(),
            thumbnail: "https://example.com/thumb.jpg",
            favicon: "https://example.com/favicon.ico",
            title: "Example",
            savedAt: ORIGINAL_CREATION_DATE.toISOString(),
            state: ItemState.ACTIVE,
            isFavorite: true,
            readingProgress: 5,
            lastReadAt: "2025-02-10T20:50:00.000Z",
            versionName: "2010-04-04",
          },
          url: TEST_ITEM_URL,
        },
      });
      expect(storage.getItemContent).toHaveBeenCalledTimes(1);
      expect(storage.getItemContent).toHaveBeenCalledWith(
        TEST_ITEM_SLUG,
        "2010-04-04",
      );

      const updatedItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .limit(1)
        .execute();

      expect(updatedItem[0].versionName).toBe("2010-04-04");
    });

    it("should return 200 with metadata even if item content is missing", async () => {
      jest
        .mocked(getItemContent)
        .mockRejectedValueOnce(new StorageError("Failed to download content"));
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEM,
        readingProgress: 5,
        lastReadAt: new Date("2025-02-10T20:50:00.000Z"),
      });
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        searchParams: { slug: TEST_ITEM_SLUG },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        item: {
          id: TEST_ITEM_ID,
          slug: TEST_ITEM_SLUG,
          createdAt: ORIGINAL_CREATION_DATE.toISOString(),
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
          highlights: [],
          metadata: {
            author: "Test Author",
            description: "An example item",
            publishedAt: ORIGINAL_PUBLISHED_DATE.toISOString(),
            thumbnail: "https://example.com/thumb.jpg",
            favicon: "https://example.com/favicon.ico",
            title: "Example",
            savedAt: ORIGINAL_CREATION_DATE.toISOString(),
            state: ItemState.ACTIVE,
            isFavorite: true,
            readingProgress: 5,
            lastReadAt: "2025-02-10T20:50:00.000Z",
            versionName: null,
          },
          url: TEST_ITEM_URL,
        },
      });
      expect(storage.getItemContent).toHaveBeenCalledTimes(1);
      expect(storage.getItemContent).toHaveBeenCalledWith(TEST_ITEM_SLUG, null);

      const updatedItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .limit(1)
        .execute();

      expect(updatedItem[0].versionName).toBe(null);
    });

    it("should return 200 with default content if version is missing", async () => {
      jest.mocked(getItemContent).mockResolvedValueOnce({
        version: null,
        content: "test content",
      });
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEM,
        readingProgress: 5,
        lastReadAt: new Date("2025-02-10T20:50:00.000Z"),
        versionName: "2010-04-04",
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        searchParams: { slug: TEST_ITEM_SLUG },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        content: "test content",
        item: {
          id: TEST_ITEM_ID,
          slug: TEST_ITEM_SLUG,
          createdAt: ORIGINAL_CREATION_DATE.toISOString(),
          labels: [],
          highlights: [],
          metadata: {
            author: "Test Author",
            description: "An example item",
            publishedAt: ORIGINAL_PUBLISHED_DATE.toISOString(),
            thumbnail: "https://example.com/thumb.jpg",
            favicon: "https://example.com/favicon.ico",
            title: "Example",
            savedAt: ORIGINAL_CREATION_DATE.toISOString(),
            state: ItemState.ACTIVE,
            isFavorite: true,
            readingProgress: 5,
            lastReadAt: "2025-02-10T20:50:00.000Z",
            versionName: null,
          },
          url: TEST_ITEM_URL,
        },
      });
      expect(storage.getItemContent).toHaveBeenCalledTimes(1);
      expect(storage.getItemContent).toHaveBeenCalledWith(
        TEST_ITEM_SLUG,
        "2010-04-04",
      );

      const updatedItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .limit(1)
        .execute();

      expect(updatedItem[0].versionName).toBe(null);
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

    it("should return item with highlights when available", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);
      await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        searchParams: { slug: TEST_ITEM_SLUG },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.item.highlights).toHaveLength(2);
      expect(data.item.highlights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: MOCK_HIGHLIGHTS[0].id,
            startOffset: MOCK_HIGHLIGHTS[0].startOffset,
            endOffset: MOCK_HIGHLIGHTS[0].endOffset,
            text: MOCK_HIGHLIGHTS[0].text,
            note: MOCK_HIGHLIGHTS[0].note,
          }),
          expect.objectContaining({
            id: MOCK_HIGHLIGHTS[1].id,
            startOffset: MOCK_HIGHLIGHTS[1].startOffset,
            endOffset: MOCK_HIGHLIGHTS[1].endOffset,
            text: MOCK_HIGHLIGHTS[1].text,
            note: MOCK_HIGHLIGHTS[1].note,
          }),
        ]),
      );
      expect(data.item.highlights[0].startOffset).toBeLessThan(
        data.item.highlights[1].startOffset,
      );
    });

    it("should return empty highlights array when no highlights exist", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);
      await testDb.db.insert(profileLabels).values(MOCK_LABELS);
      await testDb.db
        .insert(profileItemLabels)
        .values(MOCK_PROFILE_ITEM_LABELS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        searchParams: { slug: TEST_ITEM_SLUG },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.item.highlights).toEqual([]);
    });
  });

  describe("POST /api/v1/items/content", () => {
    test.each([
      ["should return 200 when updating content via regular auth", ""],
      [
        "should return 200 when updating content via api key",
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
        readingProgress: 20,
        versionName: "2010-04-04",
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        apiKey,
        body: {
          url: TEST_ITEM_URL,
          htmlContent: "<div>Test content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: TEST_ITEM_SLUG,
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });

      expect(extractMetadata).toHaveBeenCalledWith(
        TEST_ITEM_URL,
        "<div>Test content</div>",
      );

      expect(extractMainContentAsMarkdown).toHaveBeenCalledWith(
        TEST_ITEM_URL,
        "<div>Test content</div>",
      );

      expect(uploadItemContent).toHaveBeenCalledWith(
        TEST_ITEM_SLUG,
        "Markdown content",
        MOCK_METADATA,
      );

      const updatedItem = await testDb.db
        .select()
        .from(items)
        .where(eq(items.id, TEST_ITEM_ID))
        .limit(1);
      expect(
        (updatedItem[0].updatedAt as Date).getTime() >
          ORIGINAL_CREATION_DATE.getTime(),
      ).toBe(true);
      expect((updatedItem[0].createdAt as Date).getTime()).toEqual(
        ORIGINAL_CREATION_DATE.getTime(),
      );

      const updatedProfileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .limit(1);
      expect(
        (updatedProfileItem[0].savedAt as Date).getTime() >
          ORIGINAL_CREATION_DATE.getTime(),
      ).toBe(true);

      expect(updatedProfileItem[0].author).toEqual(MOCK_METADATA.author);
      expect(updatedProfileItem[0].title).toEqual(MOCK_METADATA.title);
      expect(updatedProfileItem[0].description).toEqual(
        MOCK_METADATA.description,
      );
      expect(updatedProfileItem[0].thumbnail).toEqual(MOCK_METADATA.thumbnail);
      expect(updatedProfileItem[0].favicon).toEqual(MOCK_METADATA.favicon);
      expect(updatedProfileItem[0].publishedAt).toEqual(
        ORIGINAL_PUBLISHED_DATE,
      );
    });

    it("should return 200 and overwrite previous reading state when content updated", async () => {
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
        readingProgress: 20,
        versionName: "2010-04-04",
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL,
          htmlContent: "<div>Test content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: TEST_ITEM_SLUG,
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });
      const updatedProfileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .limit(1);
      expect(updatedProfileItem[0].versionName).toEqual(null);
      expect(updatedProfileItem[0].readingProgress).toEqual(0);
    });

    it("should return 200 even when content URL does not match exactly", async () => {
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: "https://example.com//",
          htmlContent: "<div>Test content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: TEST_ITEM_SLUG,
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });

      expect(uploadItemContent).toHaveBeenCalledWith(
        TEST_ITEM_SLUG,
        "Markdown content",
        MOCK_METADATA,
      );
      expect(extractMainContentAsMarkdown).toHaveBeenCalledWith(
        TEST_ITEM_URL,
        "<div>Test content</div>",
      );
    });

    it("should return 200 and only update one profile item", async () => {
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
      });
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID_2,
        itemId: TEST_ITEM_ID,
        title: "Example",
        description: "An example item",
        author: "Test Author",
        thumbnail: "https://example.com/thumb.jpg",
        favicon: "https://example.com/favicon.ico",
        publishedAt: ORIGINAL_PUBLISHED_DATE,
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
        savedAt: ORIGINAL_CREATION_DATE,
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: "https://example.com/",
          htmlContent: "<div>Test content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: TEST_ITEM_SLUG,
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });

      const profileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(2);

      expect(profileItem[0].title).toEqual(MOCK_METADATA.title);
      expect(profileItem[1].title).toEqual("Example");
    });

    test.each<[string, Exclude<UploadStatus, UploadStatus.ERROR>]>([
      [
        "should return 200 with metadata when content already exists",
        UploadStatus.SKIPPED,
      ],
      [
        "should return 200 with metadata when content is shorter",
        UploadStatus.STORED_VERSION,
      ],
    ])("%s", async (_, status) => {
      uploadItemContent.mockResolvedValueOnce(status);
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
      });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: "https://example.com",
          htmlContent: "<div>Test content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: TEST_ITEM_SLUG,
        message:
          status === UploadStatus.SKIPPED
            ? "Content already exists"
            : "Content updated",
        status: status,
      });

      const profileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(1);
      expect(profileItem[0].title).toEqual(MOCK_METADATA.title);
      expect(profileItem[0].description).toEqual(MOCK_METADATA.description);
      expect(profileItem[0].author).toEqual(MOCK_METADATA.author);
      expect(profileItem[0].thumbnail).toEqual(MOCK_METADATA.thumbnail);
      expect(profileItem[0].favicon).toEqual(MOCK_METADATA.favicon);
      expect(profileItem[0].publishedAt).toEqual(MOCK_METADATA.publishedAt);
      expect(
        (profileItem[0].savedAt as Date).getTime() >
          ORIGINAL_CREATION_DATE.getTime(),
      ).toBe(true);
    });

    it("should return 200 without overwrite previous reading state when content not updated", async () => {
      uploadItemContent.mockResolvedValueOnce(UploadStatus.STORED_VERSION);
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
        readingProgress: 20,
        versionName: "2010-04-04",
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL,
          htmlContent: "<div>Test content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: TEST_ITEM_SLUG,
        message: "Content updated",
        status: UploadStatus.STORED_VERSION,
      });
      const updatedProfileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .limit(1);
      expect(updatedProfileItem[0].versionName).toEqual("2010-04-04");
      expect(updatedProfileItem[0].readingProgress).toEqual(20);
    });

    it("should return 200 and skip metadata update when configured", async () => {
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: "https://example.com/",
          htmlContent: "<div>Test content</div>",
          skipMetadataExtraction: true,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: TEST_ITEM_SLUG,
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });

      const profileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(1);

      expect(profileItem[0].title).toEqual("Example");
    });

    it("should return 500 when content extraction fails", async () => {
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
      });

      jest
        .mocked(extractMainContentAsMarkdown)
        .mockRejectedValueOnce(new ExtractError("Failed to extract content"));

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL,
          htmlContent: "<div>Invalid content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to extract content");
      const profileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(1);
      expect(profileItem[0].savedAt).toEqual(null);
    });

    it("should return 500 when metadata extraction fails", async () => {
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
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
      });

      jest
        .mocked(extractMetadata)
        .mockRejectedValueOnce(new MetadataError("Failed to extract metadata"));

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL,
          htmlContent: "<div>Invalid content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to extract metadata");
      const profileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(1);
      expect(profileItem[0].savedAt).toEqual(null);
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
          htmlContent: "<div>Updated content</div>",
          url: TEST_ITEM_URL,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Item not found.");
    });

    it("should return 404 if url is missing", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          htmlContent: "<div>Updated content</div>",
          url: "",
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
        url: TEST_ITEM_URL,
        slug: TEST_ITEM_SLUG,
        createdAt: new Date("2025-01-10T12:52:56-08:00"),
        updatedAt: new Date("2025-01-10T12:52:56-08:00"),
      };

      await testDb.db.insert(items).values(mockItem);
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID,
        title: "Example",
        description: "An example item",
        author: "Test Author",
        thumbnail: "https://example.com/thumb.jpg",
        favicon: "https://example.com/favicon.ico",
        publishedAt: new Date("2025-01-10T12:52:56-08:00"),
        savedAt: new Date("2025-01-10T12:52:56-08:00"),
        stateUpdatedAt: ORIGINAL_CREATION_DATE,
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe(
        "Invalid request parameters:\nhtmlContent: Required",
      );
    });
  });
});
