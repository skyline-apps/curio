import { desc, eq } from "@web/db";
import {
  items,
  ItemState,
  profileItemHighlights,
  profileItems,
  TextDirection,
} from "@web/db/schema";
import {
  extractMainContentAsMarkdown,
  extractMetadata,
} from "@web/lib/extract";
import { MOCK_METADATA } from "@web/lib/extract/__mocks__/index";
import { ExtractError, MetadataError } from "@web/lib/extract/types";
import { indexItemDocuments } from "@web/lib/search";
import {
  getItemContent,
  getItemMetadata,
  uploadItemContent,
} from "@web/lib/storage";
import { MOCK_VERSION } from "@web/lib/storage/__mocks__/index";
import { UploadStatus } from "@web/lib/storage/types";
import { APIRequest } from "@web/utils/api";
import { makeAuthenticatedMockRequest } from "@web/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  NONEXISTENT_USER_ID,
  TEST_ITEM_ID_1,
  TEST_ITEM_URL_1,
} from "@web/utils/test/data";
import { testDb } from "@web/utils/test/provider";
import { vi } from "vitest";

import { POST } from "./route";

const TEST_ITEM_SLUG = "example-com";
const ORIGINAL_PUBLISHED_DATE = new Date("2024-01-10T12:50:00-08:00");
const ORIGINAL_CREATION_DATE = new Date("2025-01-10T12:52:56-08:00");

const MOCK_HIGHLIGHTS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174010",
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    startOffset: 10,
    endOffset: 20,
    text: "highlighted text",
    note: "test note",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174011",
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    startOffset: 30,
    endOffset: 40,
    text: "another highlight",
    note: null,
    createdAt: new Date("2025-01-10T12:53:56-08:00"),
    updatedAt: new Date("2025-01-10T12:53:56-08:00"),
  },
];

describe("/api/v1/items/content", () => {
  describe("POST /api/v1/items/content", () => {
    const checkDocumentIndexed = (): void => {
      expect(indexItemDocuments).toHaveBeenCalledTimes(1);
      expect(indexItemDocuments).toHaveBeenCalledWith([
        {
          title: MOCK_METADATA.title,
          description: MOCK_METADATA.description,
          author: MOCK_METADATA.author,
          content: "Markdown content",
          contentVersionName: MOCK_VERSION,
          url: TEST_ITEM_URL_1,
          slug: TEST_ITEM_SLUG,
        },
      ]);
    };

    it("should return 200 when updating content via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEMS[0],
        readingProgress: 20,
        versionName: "2010-04-04",
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL_1,
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
        TEST_ITEM_URL_1,
        "<div>Test content</div>",
      );

      expect(extractMainContentAsMarkdown).toHaveBeenCalledWith(
        TEST_ITEM_URL_1,
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
        .where(eq(items.id, TEST_ITEM_ID_1))
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
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
      checkDocumentIndexed();
    });

    it("should return 200 and overwrite previous reading state when content updated", async () => {
      const EXTRA_PROFILE_ITEM_ID = "123e4567-e89b-12d3-a456-426614174998";
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      await testDb.db.insert(profileItemHighlights).values([
        ...MOCK_HIGHLIGHTS,
        {
          profileItemId: MOCK_PROFILE_ITEMS[1].id,
          startOffset: 5,
          endOffset: 10,
        },
      ]);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL_1,
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
        .limit(1);
      expect(updatedProfileItem[0].versionName).toEqual(null);
      expect(updatedProfileItem[0].readingProgress).toEqual(0);

      const updatedProfileItemHighlights = await testDb.db
        .select()
        .from(profileItemHighlights);
      expect(updatedProfileItemHighlights).toHaveLength(1);
      expect(updatedProfileItemHighlights[0].profileItemId).toEqual(
        EXTRA_PROFILE_ITEM_ID,
      );
      checkDocumentIndexed();
    });

    it("should return 200 even when content URL does not match exactly", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

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
        TEST_ITEM_URL_1,
        "<div>Test content</div>",
      );
      checkDocumentIndexed();
    });

    it("should return 200 and only update one profile item", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: "https://example3.com/",
          htmlContent: "<div>Test content</div>",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: "example3-com",
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });

      const profileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, MOCK_ITEMS[2].id))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(2);

      expect(profileItem[0].title).toEqual(MOCK_METADATA.title);
      expect(profileItem[1].title).toEqual("Example 3 New title not mine");
      expect(profileItem[1].savedAt).toEqual(
        new Date("2025-01-10T12:55:56-08:00"),
      );
      expect(indexItemDocuments).toHaveBeenCalledTimes(1);
      expect(indexItemDocuments).toHaveBeenCalledWith([
        {
          title: MOCK_METADATA.title,
          description: MOCK_METADATA.description,
          author: MOCK_METADATA.author,
          content: "Markdown content",
          contentVersionName: MOCK_VERSION,
          url: MOCK_ITEMS[2].url,
          slug: MOCK_ITEMS[2].slug,
        },
      ]);
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
      vi.mocked(uploadItemContent).mockResolvedValueOnce({
        versionName: "mock-old-version",
        status,
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db
        .insert(profileItems)
        .values({ ...MOCK_PROFILE_ITEMS[0], savedAt: null });
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
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
      expect(indexItemDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 200 and overwrite previous reading state when longer content exists", async () => {
      vi.mocked(uploadItemContent).mockResolvedValueOnce({
        versionName: "mock-old-version",
        status: UploadStatus.STORED_VERSION,
      });
      // This is called on the default version
      vi.mocked(getItemMetadata).mockResolvedValueOnce({
        timestamp: "2014-04-04",
        length: 100,
        hash: "contenthash",
        title: "default title",
        author: null,
        description: null,
        thumbnail: null,
        favicon: null,
        publishedAt: null,
        textDirection: TextDirection.LTR,
        textLanguage: null,
      });
      vi.mocked(getItemContent).mockResolvedValueOnce({
        version: null,
        versionName: "2014-04-04",
        content: "new longer content",
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEMS[0],
        readingProgress: 20,
        versionName: "mock-old-version",
      });
      await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL_1,
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
        .limit(1);
      expect(updatedProfileItem[0].title).toEqual("default title");
      expect(updatedProfileItem[0].author).toEqual("kim");
      expect(updatedProfileItem[0].versionName).toBe(null);
      expect(updatedProfileItem[0].readingProgress).toEqual(0);

      const updatedHighlights = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(
          eq(profileItemHighlights.profileItemId, updatedProfileItem[0].id),
        );
      expect(updatedHighlights.length).toEqual(0);
      expect(indexItemDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 200 and just force update metadata", async () => {
      vi.mocked(uploadItemContent).mockResolvedValueOnce({
        versionName: "mock-old-version",
        status: UploadStatus.STORED_VERSION,
      });
      // This is called on the default version
      vi.mocked(getItemMetadata).mockResolvedValueOnce({
        timestamp: "2014-04-04",
        length: 100,
        hash: "contenthash",
        title: "default title",
        author: null,
        description: null,
        thumbnail: null,
        favicon: null,
        publishedAt: null,
        textDirection: TextDirection.LTR,
        textLanguage: null,
      });
      vi.mocked(getItemContent).mockResolvedValueOnce({
        version: null,
        versionName: "2014-04-04",
        content: "new longer content",
      });
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEMS[0],
        readingProgress: 20,
        versionName: null,
      });
      await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL_1,
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
        .limit(1);
      expect(updatedProfileItem[0].title).toEqual("default title");
      expect(updatedProfileItem[0].author).toEqual("kim");
      expect(updatedProfileItem[0].versionName).toBe(null);
      expect(updatedProfileItem[0].readingProgress).toEqual(0);

      const updatedHighlights = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(
          eq(profileItemHighlights.profileItemId, updatedProfileItem[0].id),
        );
      expect(updatedHighlights.length).toEqual(0);
      expect(indexItemDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 200 and skip metadata update when configured", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);
      await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);

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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
        .orderBy(desc(profileItems.savedAt));
      expect(profileItem.length).toBe(1);
      expect(profileItem[0].title).toEqual("Example 1");

      const updatedHighlights = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.profileItemId, profileItem[0].id));
      expect(updatedHighlights.length).toEqual(0);
      expect(indexItemDocuments).toHaveBeenCalledTimes(1);
      expect(indexItemDocuments).toHaveBeenCalledWith([
        {
          title: MOCK_PROFILE_ITEMS[0].title,
          description: MOCK_PROFILE_ITEMS[0].description,
          author: MOCK_PROFILE_ITEMS[0].author,
          content: "Markdown content",
          contentVersionName: MOCK_VERSION,
          url: MOCK_ITEMS[0].url,
          slug: MOCK_ITEMS[0].slug,
        },
      ]);
    });

    it("should return 200 and create a new item if it doesn't exist", async () => {
      const existingItems = await testDb.db.select().from(items);
      expect(existingItems.length).toBe(0);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          htmlContent: "<div>New content</div>",
          url: TEST_ITEM_URL_1,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        slug: expect.any(String),
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });

      const newItems = await testDb.db.select().from(items);
      expect(newItems.length).toBe(1);
      const newProfileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, newItems[0].id))
        .orderBy(desc(profileItems.savedAt));
      expect(newProfileItem.length).toBe(1);
      expect(newProfileItem[0].title).toEqual("test title");
      expect(newProfileItem[0].author).toEqual("kim");
      expect(newProfileItem[0].versionName).toBe(null);
      expect(newProfileItem[0].readingProgress).toEqual(0);
      expect(newProfileItem[0].state).toBe(ItemState.ACTIVE);
    });

    it("should return 200 and update item to be active if deleted", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db
        .insert(profileItems)
        .values({ ...MOCK_PROFILE_ITEMS[0], state: ItemState.DELETED });
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          htmlContent: "<div>New content</div>",
          url: TEST_ITEM_URL_1,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        slug: expect.any(String),
        message: "Content updated and set as main version",
        status: "UPDATED_MAIN",
      });

      const newItems = await testDb.db.select().from(items);
      expect(newItems.length).toBe(1);
      const newProfileItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, newItems[0].id))
        .orderBy(desc(profileItems.savedAt));
      expect(newProfileItem.length).toBe(1);
      expect(newProfileItem[0].title).toEqual("test title");
      expect(newProfileItem[0].author).toEqual("kim");
      expect(newProfileItem[0].versionName).toBe(null);
      expect(newProfileItem[0].readingProgress).toEqual(0);
      expect(newProfileItem[0].state).toBe(ItemState.ACTIVE);
    });

    it("should return 404 if item not found and skipMetadataExtraction is true", async () => {
      const existingItems = await testDb.db.select().from(items);
      expect(existingItems.length).toBe(0);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          htmlContent: "<div>New content</div>",
          url: TEST_ITEM_URL_1,
          skipMetadataExtraction: true,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Item not found and metadata not provided.");
    });

    it("should return 500 when content extraction fails", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);

      vi.mocked(extractMainContentAsMarkdown).mockRejectedValueOnce(
        new ExtractError("Failed to extract content"),
      );

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL_1,
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(1);
      expect(profileItem[0].savedAt).toEqual(ORIGINAL_CREATION_DATE);
    });

    it("should return 500 when metadata extraction fails", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);

      vi.mocked(extractMetadata).mockRejectedValueOnce(
        new MetadataError("Failed to extract metadata"),
      );

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL_1,
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID_1))
        .orderBy(desc(profileItems.savedAt));

      expect(profileItem.length).toBe(1);
      expect(profileItem[0].savedAt).toEqual(ORIGINAL_CREATION_DATE);
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

    it("should return 400 if url is missing", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          htmlContent: "<div>Updated content</div>",
          url: "",
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("URL and HTML content are required.");
    });

    it("should return 400 if content is missing", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          htmlContent: "",
          url: TEST_ITEM_URL_1,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("URL and HTML content are required.");
    });

    it("should return 400 if content is missing", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          url: TEST_ITEM_URL_1,
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
