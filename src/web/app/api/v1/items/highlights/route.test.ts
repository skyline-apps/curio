import { vi } from "vitest";

import { eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import { items, profileItemHighlights, profileItems } from "@/db/schema";
import {
  deleteHighlightDocuments,
  indexHighlightDocuments,
} from "@/lib/search/__mocks__/index";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { MOCK_ITEMS, MOCK_PROFILE_ITEMS } from "@/utils/test/data";
import { testDb } from "@/utils/test/provider";

import { DELETE, POST } from "./route";

const TEST_HIGHLIGHT_ID_1 = "123e4567-e89b-12d3-a456-426614174111";
const TEST_HIGHLIGHT_ID_2 = "123e4567-e89b-12d3-a456-426614174222";

const MOCK_HIGHLIGHTS = [
  {
    id: TEST_HIGHLIGHT_ID_1,
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    startOffset: 0,
    endOffset: 10,
    text: "Test highlight",
    note: "Test note",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: TEST_HIGHLIGHT_ID_2,
    profileItemId: MOCK_PROFILE_ITEMS[4].id,
    startOffset: 5,
    endOffset: 15,
    text: "Another highlight",
    note: null,
    createdAt: new Date("2025-01-10T12:53:56-08:00"),
    updatedAt: new Date("2025-01-10T12:53:56-08:00"),
  },
];

describe("/api/v1/items/highlights", () => {
  beforeEach(async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);
  });

  describe("POST /api/v1/items/highlights", () => {
    it("should create new highlights", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slug: "example-com",
          highlights: [
            {
              startOffset: 20,
              endOffset: 30,
              text: "New highlight",
              note: "New note",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
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
      expect(indexHighlightDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          id: savedHighlight[0].id,
          url: MOCK_ITEMS[0].url,
          slug: "example-com",
          profileId: DEFAULT_TEST_PROFILE_ID,
          profileItemId: MOCK_PROFILE_ITEMS[0].id,
          title: MOCK_PROFILE_ITEMS[0].title,
          description: MOCK_PROFILE_ITEMS[0].description,
          author: MOCK_PROFILE_ITEMS[0].author,
          highlightText: "New highlight",
          note: "New note",
        }),
      ]);
    });

    it("should update existing highlights", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slug: "example-com",
          highlights: [
            {
              id: TEST_HIGHLIGHT_ID_1,
              startOffset: 15,
              endOffset: 25,
              text: "Updated highlight",
              note: "Updated note",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.highlights).toHaveLength(1);
      expect(data.highlights[0]).toMatchObject({
        id: TEST_HIGHLIGHT_ID_1,
        startOffset: 15,
        endOffset: 25,
        text: "Updated highlight",
        note: "Updated note",
      });

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, TEST_HIGHLIGHT_ID_1));
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
      expect(indexHighlightDocuments).toHaveBeenCalledWith([
        expect.objectContaining({
          id: savedHighlight[0].id,
          url: MOCK_ITEMS[0].url,
          slug: "example-com",
          profileId: DEFAULT_TEST_PROFILE_ID,
          profileItemId: MOCK_PROFILE_ITEMS[0].id,
          title: MOCK_PROFILE_ITEMS[0].title,
          description: MOCK_PROFILE_ITEMS[0].description,
          author: MOCK_PROFILE_ITEMS[0].author,
          highlightText: "Updated highlight",
          note: "Updated note",
        }),
      ]);
    });

    it("should not update highlights from other profiles", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slug: "example3-com",
          highlights: [
            {
              id: TEST_HIGHLIGHT_ID_2,
              startOffset: 25,
              endOffset: 35,
              text: "Should not update",
              note: "Should not update",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.highlights).toHaveLength(0);
      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, TEST_HIGHLIGHT_ID_2));
      expect(savedHighlight[0]).toMatchObject({
        startOffset: 5,
        endOffset: 15,
        text: "Another highlight",
        note: null,
      });
      expect(indexHighlightDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 400 if no slug is provided", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slug: "",
          highlights: [],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 500 if db query fails", async () => {
      vi.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slug: "example-com",
          highlights: [
            {
              startOffset: 20,
              endOffset: 30,
              text: "New highlight",
              note: "New note",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to create/update highlights");
    });

    it("should return 500 if profile item query fails", async () => {
      vi.spyOn(testDb.db, "select").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slug: "example-com",
          highlights: [
            {
              startOffset: 20,
              endOffset: 30,
              text: "New highlight",
              note: "New note",
            },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to create/update highlights");
    });
  });

  describe("DELETE /api/v1/items/highlights", () => {
    it("should delete highlights", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slug: "example-com",
          highlightIds: [TEST_HIGHLIGHT_ID_1],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.deleted).toHaveLength(1);
      expect(data.deleted[0].id).toBe(TEST_HIGHLIGHT_ID_1);

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, TEST_HIGHLIGHT_ID_1));
      expect(savedHighlight).toHaveLength(0);

      expect(deleteHighlightDocuments).toHaveBeenCalledTimes(1);
      expect(deleteHighlightDocuments).toHaveBeenCalledWith([
        TEST_HIGHLIGHT_ID_1,
      ]);
    });

    it("should not delete highlights from other profiles", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slug: "example3-com",
          highlightIds: [TEST_HIGHLIGHT_ID_2],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.deleted).toHaveLength(0);

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, TEST_HIGHLIGHT_ID_2));
      expect(savedHighlight).toHaveLength(1);
      expect(deleteHighlightDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 400 if no highlight IDs are provided", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slug: "example-com",
          highlightIds: [],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("should return 404 if slug is not found", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slug: "nonexistent-slug",
          highlightIds: [TEST_HIGHLIGHT_ID_1],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(404);

      const savedHighlight = await testDb.db
        .select()
        .from(profileItemHighlights)
        .where(eq(profileItemHighlights.id, TEST_HIGHLIGHT_ID_1));
      expect(savedHighlight).toHaveLength(1);
      expect(deleteHighlightDocuments).toHaveBeenCalledTimes(0);
    });

    it("should return 500 if profile item query fails", async () => {
      vi.spyOn(testDb.db, "select").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slug: "example-com",
          highlightIds: [TEST_HIGHLIGHT_ID_1],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to delete highlights");
    });

    it("should return 500 if delete query fails", async () => {
      vi.spyOn(testDb.db, "delete").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slug: "example-com",
          highlightIds: [TEST_HIGHLIGHT_ID_1],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to delete highlights");
    });
  });
});
