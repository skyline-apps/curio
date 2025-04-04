import { eq } from "@api/db";
import {
  items,
  ItemState,
  profileItemHighlights,
  profileItemLabels,
  profileItems,
  profileLabels,
  TextDirection,
} from "@api/db/schema";
import { getItemContent } from "@api/lib/storage";
import { MOCK_VERSION } from "@api/lib/storage/__mocks__/index";
import { StorageError } from "@api/lib/storage/types";
import { ErrorResponse } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  getRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import { testDb } from "@api/utils/test/provider";
import { ItemResultWithHighlights } from "@api/v1/items/content/validation";
import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { publicItemsContentRouter } from "./index";
import { GetItemContentResponse } from "./validation";

const TEST_ITEM_ID = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_SLUG = "example-com";
const TEST_ITEM_URL = "https://example.com";
const ORIGINAL_PUBLISHED_DATE = new Date("2024-01-10T12:50:00-08:00");
const ORIGINAL_CREATION_DATE = new Date("2025-01-10T12:52:56-08:00");
const TEST_PROFILE_ITEM_ID = "123e4567-e89b-12d3-a456-426614174999";
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
  textLanguage: "en",
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

describe("/v1/public/items/content", () => {
  let app: Hono<EnvBindings>;

  describe("GET /v1/public/items/content", () => {
    describe("authenticated", () => {
      beforeAll(() => {
        app = setUpMockApp("v1/public/items/content", publicItemsContentRouter);
      });
      it("should return 200 with item default content via regular auth", async () => {
        await testDb.db.insert(items).values(MOCK_ITEM);
        await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual({
          content: "test content",
          item: {
            id: TEST_ITEM_ID,
            profileItemId: TEST_PROFILE_ITEM_ID,
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
              textDirection: TextDirection.LTR,
              textLanguage: "en",
              title: "Example",
              savedAt: ORIGINAL_CREATION_DATE.toISOString(),
              isFavorite: true,
              state: ItemState.ACTIVE,
              source: null,
              versionName: null,
              lastReadAt: null,
              readingProgress: 0,
              stateUpdatedAt: MOCK_PROFILE_ITEM.stateUpdatedAt.toISOString(),
            },
            url: TEST_ITEM_URL,
          },
        });
        expect(getItemContent).toHaveBeenCalledExactlyOnceWith(
          expect.any(Object),
          TEST_ITEM_SLUG,
          null,
        );

        const updatedItem = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.itemId, TEST_ITEM_ID))
          .limit(1)
          .execute();

        expect(updatedItem[0].versionName).toBe(null);
      });

      it("should return 200 with basic item content when authenticated but user doesn't have item", async () => {
        vi.mocked(getItemContent).mockResolvedValueOnce({
          version: null,
          versionName: "default-version",
          content: "test content",
        });
        await testDb.db.insert(items).values(MOCK_ITEM);

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual({
          content: "test content",
          item: {
            id: TEST_ITEM_ID,
            slug: TEST_ITEM_SLUG,
            url: TEST_ITEM_URL,
            createdAt: ORIGINAL_CREATION_DATE.toISOString(),
            profileItemId: null,
            metadata: {
              title: "test title",
              description: "test description",
              publishedAt: ORIGINAL_PUBLISHED_DATE.toISOString(),
              thumbnail: null,
              favicon: null,
              textDirection: TextDirection.LTR,
              textLanguage: "en",
              savedAt: MOCK_VERSION,
            },
          },
        });
        expect(getItemContent).toHaveBeenCalledExactlyOnceWith(
          expect.any(Object),
          TEST_ITEM_SLUG,
          null,
        );
      });

      it("should return 200 with item and its labels", async () => {
        await testDb.db.insert(items).values(MOCK_ITEM);
        await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);
        await testDb.db.insert(profileLabels).values(MOCK_LABELS);
        await testDb.db
          .insert(profileItemLabels)
          .values(MOCK_PROFILE_ITEM_LABELS);

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });
        expect(response.status).toBe(200);

        const data: GetItemContentResponse = await response.json();
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
        vi.mocked(getItemContent).mockResolvedValueOnce({
          version: "2010-04-04",
          versionName: "2010-04-04",
          content: "custom version content",
        });
        await testDb.db.insert(items).values(MOCK_ITEM);
        await testDb.db.insert(profileItems).values({
          ...MOCK_PROFILE_ITEM,
          readingProgress: 5,
          lastReadAt: new Date("2025-02-10T20:50:00.000Z"),
          versionName: "2010-04-04",
        });

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual({
          content: "custom version content",
          item: {
            id: TEST_ITEM_ID,
            profileItemId: TEST_PROFILE_ITEM_ID,
            slug: TEST_ITEM_SLUG,
            createdAt: ORIGINAL_CREATION_DATE.toISOString(),
            labels: [],
            highlights: [],
            metadata: expect.objectContaining({
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
              stateUpdatedAt: MOCK_PROFILE_ITEM.stateUpdatedAt.toISOString(),
              source: null,
            }),
            url: TEST_ITEM_URL,
          },
        });
        expect(getItemContent).toHaveBeenCalledExactlyOnceWith(
          expect.any(Object),
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
        vi.mocked(getItemContent).mockRejectedValueOnce(
          new StorageError("Failed to download content"),
        );
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

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual({
          item: {
            id: TEST_ITEM_ID,
            profileItemId: TEST_PROFILE_ITEM_ID,
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
            metadata: expect.objectContaining({
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
              stateUpdatedAt: MOCK_PROFILE_ITEM.stateUpdatedAt.toISOString(),
            }),
            url: TEST_ITEM_URL,
          },
        });
        expect(getItemContent).toHaveBeenCalledExactlyOnceWith(
          expect.any(Object),
          TEST_ITEM_SLUG,
          null,
        );

        const updatedItem = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.itemId, TEST_ITEM_ID))
          .limit(1)
          .execute();

        expect(updatedItem[0].versionName).toBe(null);
      });

      it("should return 200 with default content if version is missing", async () => {
        vi.mocked(getItemContent).mockResolvedValueOnce({
          version: null,
          versionName: "blah-version",
          content: "test content",
        });
        await testDb.db.insert(items).values(MOCK_ITEM);
        await testDb.db.insert(profileItems).values({
          ...MOCK_PROFILE_ITEM,
          readingProgress: 5,
          lastReadAt: new Date("2025-02-10T20:50:00.000Z"),
          versionName: "2010-04-04",
        });

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual({
          content: "test content",
          item: {
            id: TEST_ITEM_ID,
            profileItemId: TEST_PROFILE_ITEM_ID,
            slug: TEST_ITEM_SLUG,
            createdAt: ORIGINAL_CREATION_DATE.toISOString(),
            labels: [],
            highlights: [],
            metadata: expect.objectContaining({
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
              stateUpdatedAt: MOCK_PROFILE_ITEM.stateUpdatedAt.toISOString(),
            }),
            url: TEST_ITEM_URL,
          },
        });
        expect(getItemContent).toHaveBeenCalledExactlyOnceWith(
          expect.any(Object),
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

      it("should return 404 if item not found", async () => {
        const response = await getRequest(app, "v1/public/items/content", {
          slug: "nonexistent",
        });
        expect(response.status).toBe(404);
        const data: ErrorResponse = await response.json();
        expect(data.error).toBe("Item not found.");
      });

      it("should return 404 if slug is missing", async () => {
        const response = await getRequest(app, "v1/public/items/content", {
          slug: "",
        });
        expect(response.status).toBe(404);
        const data: ErrorResponse = await response.json();
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

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });
        expect(response.status).toBe(200);

        const data: GetItemContentResponse = await response.json();
        const item = data.item as ItemResultWithHighlights;
        expect(item.highlights).toHaveLength(2);
        expect(item.highlights).toEqual(
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
        expect(item.highlights[0].startOffset).toBeLessThan(
          item.highlights[1].startOffset,
        );
      });

      it("should return empty highlights array when no highlights exist", async () => {
        await testDb.db.insert(items).values(MOCK_ITEM);
        await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);
        await testDb.db.insert(profileLabels).values(MOCK_LABELS);
        await testDb.db
          .insert(profileItemLabels)
          .values(MOCK_PROFILE_ITEM_LABELS);

        const response = await getRequest(app, "v1/public/items/content", {
          slug: TEST_ITEM_SLUG,
        });
        expect(response.status).toBe(200);

        const data: GetItemContentResponse = await response.json();
        const item = data.item as ItemResultWithHighlights;
        expect(item.highlights).toEqual([]);
      });
    });
  });

  describe("unauthenticated", () => {
    beforeAll(() => {
      app = setUpMockApp(
        "v1/public/items/content",
        publicItemsContentRouter,
        null,
      );
    });

    it("should return 200 with basic item content when unauthenticated", async () => {
      vi.mocked(getItemContent).mockResolvedValueOnce({
        version: null,
        versionName: "default-version",
        content: "test content",
      });
      await testDb.db.insert(items).values(MOCK_ITEM);

      const response = await getRequest(app, "v1/public/items/content", {
        slug: TEST_ITEM_SLUG,
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        content: "test content",
        item: {
          id: TEST_ITEM_ID,
          slug: TEST_ITEM_SLUG,
          url: TEST_ITEM_URL,
          createdAt: ORIGINAL_CREATION_DATE.toISOString(),
          profileItemId: null,
          metadata: {
            title: "test title",
            description: "test description",
            publishedAt: ORIGINAL_PUBLISHED_DATE.toISOString(),
            thumbnail: null,
            favicon: null,
            textDirection: TextDirection.LTR,
            textLanguage: "en",
            savedAt: MOCK_VERSION,
          },
        },
      });
      expect(getItemContent).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        TEST_ITEM_SLUG,
        null,
      );
    });

    it("should return 200 with basic item metadata when unauthenticated and content not found", async () => {
      vi.mocked(getItemContent).mockRejectedValueOnce(
        new StorageError("Failed to download content"),
      );
      await testDb.db.insert(items).values(MOCK_ITEM);

      const response = await getRequest(app, "v1/public/items/content", {
        slug: TEST_ITEM_SLUG,
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        item: {
          id: TEST_ITEM_ID,
          slug: TEST_ITEM_SLUG,
          url: TEST_ITEM_URL,
          createdAt: ORIGINAL_CREATION_DATE.toISOString(),
          profileItemId: null,
          metadata: {
            author: "kim",
            title: "test title",
            description: "test description",
            publishedAt: ORIGINAL_PUBLISHED_DATE.toISOString(),
            thumbnail: null,
            favicon: null,
            textDirection: TextDirection.LTR,
            textLanguage: "en",
          },
        },
      });
      expect(getItemContent).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        TEST_ITEM_SLUG,
        null,
      );
    });

    it("should return 404 when item not found for unauthenticated request", async () => {
      const response = await getRequest(app, "v1/public/items/content", {
        slug: "nonexistent",
      });
      expect(response.status).toBe(404);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Item not found.");
    });
  });
});
