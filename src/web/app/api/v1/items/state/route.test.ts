import { and, eq, not, or } from "@web/db";
import { DbErrorCode } from "@web/db/errors";
import {
  items,
  ItemState,
  profileItemHighlights,
  profileItems,
} from "@web/db/schema";
import { deleteHighlightDocuments } from "@web/lib/search/__mocks__";
import { APIRequest } from "@web/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@web/utils/test/api";
import {
  MOCK_HIGHLIGHTS,
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  NONEXISTENT_USER_ID,
  TEST_ITEM_ID_DELETED,
} from "@web/utils/test/data";
import { testDb } from "@web/utils/test/provider";
import { vi } from "vitest";

import { POST } from "./route";

const ORIGINAL_ARCHIVED_TIME = new Date("2025-01-10T12:52:56-08:00");

describe("/api/v1/items/state", () => {
  describe("POST /api/v1/items/state", () => {
    it("should return 200 archiving items via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com,example3-com",
          state: ItemState.ARCHIVED,
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
          stateUpdatedAt: profileItems.stateUpdatedAt,
          profileId: profileItems.profileId,
        })
        .from(profileItems)
        .innerJoin(items, eq(items.id, profileItems.itemId))
        .where(eq(profileItems.state, ItemState.ARCHIVED));

      expect(updatedItems).toHaveLength(2);

      expect(updatedItems).toEqual([
        expect.objectContaining({
          id: expect.any(String),
          slug: "example-com",
          stateUpdatedAt: expect.any(Date),
          profileId: DEFAULT_TEST_PROFILE_ID,
        }),
        expect.objectContaining({
          id: expect.any(String),
          slug: "example3-com",
          stateUpdatedAt: expect.any(Date),
          profileId: DEFAULT_TEST_PROFILE_ID,
        }),
      ]);
    });

    it("should return 200 when deleting items and set unique updatedAt", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com,example3-com",
          state: ItemState.DELETED,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example-com" }, { slug: "example3-com" }],
      });

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(
          and(
            eq(profileItems.state, ItemState.DELETED),
            not(eq(profileItems.itemId, TEST_ITEM_ID_DELETED)),
          ),
        );

      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].stateUpdatedAt).toBeInstanceOf(Date);
      expect(updatedItems[1].stateUpdatedAt).toBeInstanceOf(Date);
      expect(updatedItems[0].stateUpdatedAt.toISOString()).not.toEqual(
        updatedItems[1].stateUpdatedAt.toISOString(),
      );
    });

    it("should return 200 if item is already archived", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
          state: ItemState.ARCHIVED,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example-com" }],
      });

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.state, ItemState.ARCHIVED));

      expect(updatedItems).toHaveLength(1);
      expect(
        (updatedItems[0].stateUpdatedAt as Date).getTime() >
          ORIGINAL_ARCHIVED_TIME.getTime(),
      ).toBe(true);
    });

    it("should return 200 converting item back to active", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS[0]);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS[0]);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
          state: ItemState.ACTIVE,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example-com" }],
      });

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.state, ItemState.ACTIVE));

      expect(updatedItems).toHaveLength(1);
      expect(
        (updatedItems[0].stateUpdatedAt as Date).getTime() >
          ORIGINAL_ARCHIVED_TIME.getTime(),
      ).toBe(true);
    });

    it("should return 200 deleting with highlights", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com,example2-com",
          state: ItemState.DELETED,
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
        .where(
          or(
            eq(profileItems.id, MOCK_PROFILE_ITEMS[0].id),
            eq(profileItems.id, MOCK_PROFILE_ITEMS[1].id),
          ),
        );

      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].state).toBe(ItemState.DELETED);
      expect(updatedItems[1].state).toBe(ItemState.DELETED);

      const highlights = await testDb.db
        .select()
        .from(profileItemHighlights)
        .orderBy(profileItemHighlights.id);
      expect(highlights).toHaveLength(1);
      expect(highlights[0].id).toBe(MOCK_HIGHLIGHTS[2].id);

      expect(deleteHighlightDocuments).toHaveBeenCalledExactlyOnceWith([
        MOCK_HIGHLIGHTS[0].id,
        MOCK_HIGHLIGHTS[1].id,
      ]);
    });

    it("should return 200 if request body includes invalid slugs", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "test-slug",
          state: ItemState.ARCHIVED,
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
          state: ItemState.ACTIVE,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 if state is missing", async () => {
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

    it("should return 400 if state is invalid", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
          state: "invalid-state",
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
          state: ItemState.ARCHIVED,
        },
      });

      const currentItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.state, ItemState.ARCHIVED));
      expect(currentItems).toHaveLength(2);

      const response = await POST(request);
      expect(response.status).toBe(401);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.state, ItemState.ARCHIVED));
      expect(updatedItems).toHaveLength(2);
    });

    it("should return 401 if no valid auth is provided", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeUnauthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: ["example-com"],
          state: ItemState.ARCHIVED,
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
          state: ItemState.ARCHIVED,
        },
      });

      type PgTx = Parameters<Parameters<typeof testDb.db.transaction>[0]>[0];

      vi.spyOn(testDb.db, "transaction").mockImplementationOnce(
        async (callback) => {
          return callback({
            ...testDb.db,
            insert: () => {
              throw { code: DbErrorCode.UniqueViolation };
            },
          } as unknown as PgTx);
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
