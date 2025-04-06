import { eq } from "@api/db";
import { DbErrorCode } from "@api/db/errors";
import { items, profileItemHighlights, profileItems } from "@api/db/schema";
import {
  deleteHighlightDocuments,
  indexHighlightDocuments,
  searchHighlightDocuments,
} from "@api/lib/search/__mocks__/index";
import { HighlightDocumentResult, SearchError } from "@api/lib/search/types";
import { ErrorResponse } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  deleteRequest,
  getRequest,
  postRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import {
  MOCK_HIGHLIGHTS,
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
} from "@api/utils/test/data";
import { testDb } from "@api/utils/test/provider";
import { TextDirection } from "@shared/db";
import {
  CreateOrUpdateHighlightResponse,
  DeleteHighlightResponse,
  GetHighlightsResponse,
} from "@shared/v1/items/highlights";
import { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { itemsHighlightRouter } from "./index";

const MOCK_SEARCH_RESULTS: HighlightDocumentResult[] = [
  {
    ...MOCK_HIGHLIGHTS[1],
    highlightText: MOCK_HIGHLIGHTS[1].text,
    note: MOCK_HIGHLIGHTS[1].note || "",
    profileId: DEFAULT_TEST_PROFILE_ID,
    url: MOCK_ITEMS[1].url,
    slug: MOCK_ITEMS[1].slug,
    title: MOCK_PROFILE_ITEMS[1].title,
    textDirection: TextDirection.LTR,
    author: MOCK_PROFILE_ITEMS[1].author,
  },
  {
    ...MOCK_HIGHLIGHTS[0],
    highlightText: MOCK_HIGHLIGHTS[0].text,
    note: MOCK_HIGHLIGHTS[0].note || "",
    profileId: DEFAULT_TEST_PROFILE_ID,
    url: MOCK_ITEMS[0].url,
    slug: MOCK_ITEMS[0].slug,
    title: MOCK_PROFILE_ITEMS[0].title,
    textDirection: TextDirection.LTR,
    author: MOCK_PROFILE_ITEMS[0].author,
  },
];

describe("/v1/items/highlights", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/items/highlights", itemsHighlightRouter);
  });

  beforeEach(async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);
  });

  describe("GET /v1/items/highlights", () => {
    it("should return all highlights in order of updatedAt by default", async () => {
      searchHighlightDocuments.mockResolvedValueOnce({
        hits: MOCK_SEARCH_RESULTS,
        estimatedTotalHits: MOCK_SEARCH_RESULTS.length,
      });

      const response = await getRequest(app, "v1/items/highlights");

      expect(response.status).toBe(200);

      const data: GetHighlightsResponse = await response.json();
      expect(data.highlights).toHaveLength(2);
      expect(searchHighlightDocuments).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        "",
        DEFAULT_TEST_PROFILE_ID,
        {
          offset: 0,
          limit: 20,
          sort: ["updatedAt:desc"],
        },
      );
      expect(data.highlights[0].id).toBe(MOCK_HIGHLIGHTS[1].id);
      expect(data.highlights[1].id).toBe(MOCK_HIGHLIGHTS[0].id);
      expect(data.highlights[0].textExcerpt).toBe(undefined);
      expect(data.highlights[0].noteExcerpt).toBe(undefined);
      expect(data.highlights[1].textExcerpt).toBe(undefined);
      expect(data.highlights[1].noteExcerpt).toBe(undefined);
      expect(data.nextOffset).toBe(undefined);
      expect(data.total).toBe(2);
    });

    it("should return highlights filtered on search query if provided", async () => {
      const response = await getRequest(app, "v1/items/highlights", {
        search: "test query",
      });

      expect(response.status).toBe(200);

      const data: GetHighlightsResponse = await response.json();
      expect(searchHighlightDocuments).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        "test query",
        DEFAULT_TEST_PROFILE_ID,
        {
          offset: 0,
          limit: 20,
        },
      );
      expect(data.highlights).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it("should paginate highlight results", async () => {
      searchHighlightDocuments.mockResolvedValueOnce({
        hits: [MOCK_SEARCH_RESULTS[0]],
        estimatedTotalHits: MOCK_SEARCH_RESULTS.length,
      });
      const response = await getRequest(app, "v1/items/highlights", {
        limit: "1",
        search: "test query",
      });
      expect(response.status).toBe(200);

      const data: GetHighlightsResponse = await response.json();
      expect(data.highlights).toHaveLength(1);
      expect(data.highlights[0].id).toBe(MOCK_HIGHLIGHTS[1].id);
      expect(data.nextOffset).toBe(1);
      expect(data.total).toBe(2);
      expect(searchHighlightDocuments).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        "test query",
        DEFAULT_TEST_PROFILE_ID,
        {
          offset: 0,
          limit: 1,
        },
      );

      searchHighlightDocuments.mockResolvedValueOnce({
        hits: [MOCK_SEARCH_RESULTS[1]],
        estimatedTotalHits: MOCK_SEARCH_RESULTS.length,
      });
      const response2 = await getRequest(app, "v1/items/highlights", {
        limit: "1",
        offset: "1",
        search: "test query",
      });
      expect(response2.status).toBe(200);

      const data2: GetHighlightsResponse = await response2.json();
      expect(data2.highlights).toHaveLength(1);
      expect(data2.highlights[0].id).toBe(MOCK_HIGHLIGHTS[0].id);
      expect(data2.nextOffset).toBeUndefined();
      expect(data2.total).toBe(2);
      expect(searchHighlightDocuments).toHaveBeenCalledTimes(2);
      expect(searchHighlightDocuments).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        "test query",
        DEFAULT_TEST_PROFILE_ID,
        {
          offset: 0,
          limit: 1,
        },
      );
    });

    it("should return 500 if search fails", async () => {
      searchHighlightDocuments.mockRejectedValueOnce(
        new SearchError("search failed"),
      );

      const response = await getRequest(app, "v1/items/highlights");
      expect(response.status).toBe(500);
    });
  });

  describe("POST /v1/items/highlights", () => {
    it("should create new highlights", async () => {
      const response = await postRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlights: [
          {
            startOffset: 20,
            endOffset: 30,
            text: "New highlight",
            note: "New note",
          },
        ],
      });

      expect(response.status).toBe(200);

      const data: CreateOrUpdateHighlightResponse = await response.json();
      expect(data.highlights).toHaveLength(1);
      expect(data.highlights[0]).toMatchObject({
        startOffset: 20,
        endOffset: 30,
        text: "New highlight",
        note: "New note",
      });

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.text, "New highlight"));
      expect(savedHighlight).toHaveLength(1);
      expect(savedHighlight[0]).toMatchObject({
        id: expect.any(String),
        profileItemId: MOCK_PROFILE_ITEMS[0].id,
        startOffset: 20,
        endOffset: 30,
        text: "New highlight",
        note: "New note",
      });

      expect(indexHighlightDocuments).toHaveBeenCalledTimes(1);
      expect(indexHighlightDocuments).toHaveBeenCalledWith(expect.any(Object), [
        expect.objectContaining({
          id: savedHighlight[0].id,
          url: MOCK_ITEMS[0].url,
          slug: "example-com",
          profileId: DEFAULT_TEST_PROFILE_ID,
          profileItemId: MOCK_PROFILE_ITEMS[0].id,
          title: MOCK_PROFILE_ITEMS[0].title,
          textDirection: TextDirection.LTR,
          author: MOCK_PROFILE_ITEMS[0].author,
          highlightText: "New highlight",
          note: "New note",
        }),
      ]);
    });

    it("should update existing highlights", async () => {
      const response = await postRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlights: [
          {
            id: MOCK_HIGHLIGHTS[0].id,
            startOffset: 15,
            endOffset: 25,
            text: "Updated highlight",
            note: "Updated note",
          },
        ],
      });

      expect(response.status).toBe(200);

      const data: CreateOrUpdateHighlightResponse = await response.json();
      expect(data.highlights).toHaveLength(1);
      expect(data.highlights[0]).toMatchObject({
        id: MOCK_HIGHLIGHTS[0].id,
        startOffset: 15,
        endOffset: 25,
        text: "Updated highlight",
        note: "Updated note",
      });

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, MOCK_HIGHLIGHTS[0].id));
      expect(savedHighlight).toHaveLength(1);
      expect(savedHighlight[0]).toMatchObject({
        startOffset: 15,
        endOffset: 25,
        text: "Updated highlight",
        note: "Updated note",
      });
      expect(savedHighlight[0].updatedAt.getTime()).toBeGreaterThan(
        savedHighlight[0].createdAt.getTime(),
      );
      expect(indexHighlightDocuments).toHaveBeenCalledTimes(1);
      expect(indexHighlightDocuments).toHaveBeenCalledWith(expect.any(Object), [
        expect.objectContaining({
          id: savedHighlight[0].id,
          url: MOCK_ITEMS[0].url,
          slug: "example-com",
          profileId: DEFAULT_TEST_PROFILE_ID,
          profileItemId: MOCK_PROFILE_ITEMS[0].id,
          title: MOCK_PROFILE_ITEMS[0].title,
          textDirection: TextDirection.LTR,
          author: MOCK_PROFILE_ITEMS[0].author,
          highlightText: "Updated highlight",
          note: "Updated note",
        }),
      ]);
    });

    it("should not update highlights from other profiles", async () => {
      const response = await postRequest(app, "v1/items/highlights", {
        slug: "example3-com",
        highlights: [
          {
            id: MOCK_HIGHLIGHTS[1].id,
            startOffset: 25,
            endOffset: 35,
            text: "Should not update",
            note: "Should not update",
          },
        ],
      });

      expect(response.status).toBe(200);

      const data: CreateOrUpdateHighlightResponse = await response.json();
      expect(data.highlights).toHaveLength(0);
      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, MOCK_HIGHLIGHTS[1].id));
      expect(savedHighlight[0]).toMatchObject({
        startOffset: 5,
        endOffset: 15,
        text: "Another highlight",
        note: null,
      });
      expect(indexHighlightDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 400 if no slug is provided", async () => {
      const response = await postRequest(app, "v1/items/highlights", {
        slug: "",
        highlights: [],
      });
      expect(response.status).toBe(400);
    });

    it("should return 500 if db query fails", async () => {
      vi.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await postRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlights: [
          {
            startOffset: 20,
            endOffset: 30,
            text: "New highlight",
            note: "New note",
          },
        ],
      });
      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Failed to create/update highlights");
    });

    it("should return 500 if insert query fails", async () => {
      vi.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await postRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlights: [
          {
            startOffset: 20,
            endOffset: 30,
            text: "New highlight",
            note: "New note",
          },
        ],
      });

      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Failed to create/update highlights");
    });
  });

  describe("DELETE /v1/items/highlights", () => {
    it("should delete highlights", async () => {
      const response = await deleteRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlightIds: [MOCK_HIGHLIGHTS[0].id],
      });

      expect(response.status).toBe(200);

      const data: DeleteHighlightResponse = await response.json();
      expect(data.deleted).toHaveLength(1);
      expect(data.deleted[0].id).toBe(MOCK_HIGHLIGHTS[0].id);

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, MOCK_HIGHLIGHTS[0].id));
      expect(savedHighlight).toHaveLength(0);

      expect(deleteHighlightDocuments).toHaveBeenCalledTimes(1);
      expect(deleteHighlightDocuments).toHaveBeenCalledWith(
        expect.any(Object),
        [MOCK_HIGHLIGHTS[0].id],
      );
    });

    it("should not delete highlights from other profiles", async () => {
      const response = await deleteRequest(app, "v1/items/highlights", {
        slug: "example3-com",
        highlightIds: [MOCK_HIGHLIGHTS[1].id],
      });

      expect(response.status).toBe(200);

      const data: DeleteHighlightResponse = await response.json();
      expect(data.deleted).toHaveLength(0);

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, MOCK_HIGHLIGHTS[1].id));
      expect(savedHighlight).toHaveLength(1);
      expect(deleteHighlightDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 400 if no highlight IDs are provided", async () => {
      const response = await deleteRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlightIds: [],
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 if slug is not found", async () => {
      const response = await deleteRequest(app, "v1/items/highlights", {
        slug: "nonexistent-slug",
        highlightIds: [MOCK_HIGHLIGHTS[0].id],
      });
      expect(response.status).toBe(404);

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, MOCK_HIGHLIGHTS[0].id));
      expect(savedHighlight).toHaveLength(1);
      expect(deleteHighlightDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 500 if profile item query fails", async () => {
      vi.spyOn(testDb.db, "select").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await deleteRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlightIds: [MOCK_HIGHLIGHTS[0].id],
      });

      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Failed to delete highlights");
    });

    it("should return 500 if delete query fails", async () => {
      vi.spyOn(testDb.db, "delete").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await deleteRequest(app, "v1/items/highlights", {
        slug: "example-com",
        highlightIds: [MOCK_HIGHLIGHTS[0].id],
      });

      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Failed to delete highlights");
    });
  });
});
