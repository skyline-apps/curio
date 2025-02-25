import { vi } from "vitest";

import { UploadStatus } from "@/app/api/v1/items/content/validation";
import { desc, eq } from "@/db";
import { items, profileItemHighlights, profileItems } from "@/db/schema";
import { extractMainContentAsMarkdown, extractMetadata } from "@/lib/extract";
import { MOCK_METADATA } from "@/lib/extract/__mocks__/index";
import { ExtractError, MetadataError } from "@/lib/extract/types";
import { indexDocuments } from "@/lib/search";
import {
  getItemContent,
  getItemMetadata,
  uploadItemContent,
} from "@/lib/storage";
import { MOCK_VERSION } from "@/lib/storage/__mocks__/index";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
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
const TEST_PROFILE_ITEM_ID = "123e4567-e89b-12d3-a456-426614174999";

const MOCK_ITEM = {
  id: TEST_ITEM_ID,
  url: TEST_ITEM_URL,
  slug: TEST_ITEM_SLUG,
  createdAt: ORIGINAL_CREATION_DATE,
  updatedAt: ORIGINAL_CREATION_DATE,
};

const MOCK_ITEM_2 = {
  id: "123e4567-e89b-12d3-a456-426614174002",
  url: "https://example2.com",
  slug: "example2-com",
  createdAt: ORIGINAL_CREATION_DATE,
  updatedAt: ORIGINAL_CREATION_DATE,
};

const MOCK_PROFILE_ITEM = {
  id: TEST_PROFILE_ITEM_ID,
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
  describe("POST /api/v1/items/content", () => {
    const checkDocumentIndexed = (): void => {
      expect(indexDocuments).toHaveBeenCalledTimes(1);
      expect(indexDocuments).toHaveBeenCalledWith([
        {
          profileItemId: TEST_PROFILE_ITEM_ID,
          profileId: DEFAULT_TEST_PROFILE_ID,
          content: "Markdown content",
          contentVersionName: MOCK_VERSION,
          url: TEST_ITEM_URL,
          slug: TEST_ITEM_SLUG,
        },
      ]);
    };

    test.each([
      ["should return 200 when updating content via regular auth", ""],
      [
        "should return 200 when updating content via api key",
        DEFAULT_TEST_API_KEY,
      ],
    ])("%s", async (_, apiKey) => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEM,
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
      checkDocumentIndexed();
    });

    it("should return 200 and overwrite previous reading state when content updated", async () => {
      const EXTRA_PROFILE_ITEM_ID = "123e4567-e89b-12d3-a456-426614174998";
      await testDb.db.insert(items).values([MOCK_ITEM, MOCK_ITEM_2]);
      await testDb.db.insert(profileItems).values([
        {
          ...MOCK_PROFILE_ITEM,
          readingProgress: 20,
          versionName: "2010-04-04",
        },
        {
          id: EXTRA_PROFILE_ITEM_ID,
          itemId: MOCK_ITEM_2.id,
          profileId: DEFAULT_TEST_PROFILE_ID,
          title: "Hello",
        },
      ]);
      await testDb.db.insert(profileItemHighlights).values([
        ...MOCK_HIGHLIGHTS,
        {
          profileItemId: EXTRA_PROFILE_ITEM_ID,
          startOffset: 5,
          endOffset: 10,
        },
      ]);

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
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

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
      checkDocumentIndexed();
    });

    it("should return 200 and only update one profile item", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values([
        MOCK_PROFILE_ITEM,
        {
          profileId: DEFAULT_TEST_PROFILE_ID_2,
          itemId: TEST_ITEM_ID,
          title: "Example not mine",
          savedAt: new Date("2025-01-15T11:50:50-08:00"),
        },
      ]);

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
      expect(profileItem[1].title).toEqual("Example not mine");
      expect(profileItem[1].savedAt).toEqual(
        new Date("2025-01-15T11:50:50-08:00"),
      );
      checkDocumentIndexed();
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
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEM,
        savedAt: null,
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
      expect(indexDocuments).toHaveBeenCalledTimes(0);
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
      });
      vi.mocked(getItemContent).mockResolvedValueOnce({
        version: null,
        versionName: "2014-04-04",
        content: "new longer content",
      });
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEM,
        readingProgress: 20,
        versionName: "mock-old-version",
      });
      await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);

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
      expect(updatedProfileItem[0].title).toEqual("default title");
      expect(updatedProfileItem[0].author).toBe(null);
      expect(updatedProfileItem[0].versionName).toBe(null);
      expect(updatedProfileItem[0].readingProgress).toEqual(0);

      const updatedHighlights = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(
          eq(profileItemHighlights.profileItemId, updatedProfileItem[0].id),
        );
      expect(updatedHighlights.length).toEqual(0);
      expect(indexDocuments).toHaveBeenCalledTimes(1);
      expect(indexDocuments).toHaveBeenCalledWith([
        {
          profileItemId: updatedProfileItem[0].id,
          profileId: DEFAULT_TEST_PROFILE_ID,
          content: "new longer content",
          contentVersionName: "2014-04-04",
          url: MOCK_ITEM.url,
          slug: MOCK_ITEM.slug,
        },
      ]);
    });

    it("should return 200 and skip metadata update when configured", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);
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
        .where(eq(profileItems.itemId, TEST_ITEM_ID))
        .orderBy(desc(profileItems.savedAt));
      expect(profileItem.length).toBe(1);
      expect(profileItem[0].title).toEqual("Example");

      const updatedHighlights = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.profileItemId, profileItem[0].id));
      expect(updatedHighlights.length).toEqual(0);
      expect(indexDocuments).toHaveBeenCalledTimes(1);
      expect(indexDocuments).toHaveBeenCalledWith([
        {
          profileItemId: profileItem[0].id,
          profileId: DEFAULT_TEST_PROFILE_ID,
          content: "Markdown content",
          contentVersionName: MOCK_VERSION,
          url: MOCK_ITEM.url,
          slug: MOCK_ITEM.slug,
        },
      ]);
    });

    it("should return 500 when content extraction fails", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

      vi.mocked(extractMainContentAsMarkdown).mockRejectedValueOnce(
        new ExtractError("Failed to extract content"),
      );

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
      expect(profileItem[0].savedAt).toEqual(ORIGINAL_CREATION_DATE);
    });

    it("should return 500 when metadata extraction fails", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

      vi.mocked(extractMetadata).mockRejectedValueOnce(
        new MetadataError("Failed to extract metadata"),
      );

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
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

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
