import { vi } from "vitest";

import { and, eq, not } from "@/db";
import { DbErrorCode } from "@/db/errors";
import { items, ItemState, profileItems } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  NONEXISTENT_USER_ID,
  TEST_ITEM_ID_1,
  TEST_ITEM_ID_DELETED,
} from "@/utils/test/data";
import { testDb } from "@/utils/test/provider";

import { POST } from "./route";

const ORIGINAL_ARCHIVED_TIME = new Date("2025-01-10T12:52:56-08:00");

describe("/api/v1/items/state", () => {
  describe("POST /api/v1/items/state", () => {
    test.each([
      ["should return 200 archiving items via regular auth", ""],
      ["should return 200 archiving items via api key", DEFAULT_TEST_API_KEY],
    ])("%s", async (_, apiKey) => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        apiKey: apiKey,
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
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID_1,
        title: "Old title",
        author: "Kim",
        state: ItemState.ARCHIVED,
        isFavorite: false,
        stateUpdatedAt: ORIGINAL_ARCHIVED_TIME,
        savedAt: new Date("2025-01-01T00:00:00.000Z"),
        lastReadAt: null,
      });
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
      await testDb.db.insert(profileItems).values({
        profileId: DEFAULT_TEST_PROFILE_ID,
        itemId: TEST_ITEM_ID_1,
        title: "Old title",
        author: "Kim",
        state: ItemState.ARCHIVED,
        isFavorite: false,
        stateUpdatedAt: ORIGINAL_ARCHIVED_TIME,
        savedAt: new Date("2025-01-01T00:00:00.000Z"),
        lastReadAt: null,
      });
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

    it("should return 401 if invalid api key is provided", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        apiKey: "invalid-api-key",
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

      vi.spyOn(testDb.db, "update").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
