import { vi } from "vitest";

import { eq } from "@/db";
import { DbErrorCode } from "@/db/errors";
import { items, ItemState, profileItems } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_PROFILE_ID,
  makeAuthenticatedMockRequest,
  makeUnauthenticatedMockRequest,
} from "@/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  NONEXISTENT_USER_ID,
  TEST_ITEM_ID_1,
  TEST_ITEM_ID_2,
} from "@/utils/test/data";
import { testDb } from "@/utils/test/provider";

import { POST } from "./route";

const ORIGINAL_ARCHIVED_TIME = new Date("2025-01-10T12:52:56-08:00");

describe("/api/v1/items/favorite", () => {
  describe("POST /api/v1/items/favorite", () => {
    it("should return 200 favoriting items via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example2-com,example3-com",
          favorite: true,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example2-com" }, { slug: "example3-com" }],
      });

      const updatedItems = await testDb.db
        .select({
          id: items.id,
          slug: items.slug,
          state: profileItems.state,
          isFavorite: profileItems.isFavorite,
          profileId: profileItems.profileId,
        })
        .from(profileItems)
        .innerJoin(items, eq(items.id, profileItems.itemId))
        .where(eq(profileItems.isFavorite, true))
        .orderBy(items.slug);

      expect(updatedItems).toHaveLength(2);

      expect(updatedItems).toEqual([
        expect.objectContaining({
          id: MOCK_ITEMS[1].id,
          slug: "example2-com",
          state: ItemState.ACTIVE,
          profileId: DEFAULT_TEST_PROFILE_ID,
          isFavorite: true,
        }),
        expect.objectContaining({
          id: MOCK_ITEMS[2].id,
          slug: "example3-com",
          state: ItemState.ARCHIVED,
          profileId: DEFAULT_TEST_PROFILE_ID,
          isFavorite: true,
        }),
      ]);
    });

    it("should return 200 when unfavoriting items", async () => {
      await testDb.db.insert(items).values([MOCK_ITEMS[0], MOCK_ITEMS[1]]);
      await testDb.db.insert(profileItems).values([
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          itemId: TEST_ITEM_ID_1,
          title: "Old title",
          author: "Kim",
          state: ItemState.ARCHIVED,
          isFavorite: false,
          stateUpdatedAt: ORIGINAL_ARCHIVED_TIME,
          savedAt: new Date("2025-01-01T00:00:00.000Z"),
          lastReadAt: null,
        },
        {
          profileId: DEFAULT_TEST_PROFILE_ID,
          itemId: TEST_ITEM_ID_2,
          title: "Old title 2",
          author: "Kim",
          state: ItemState.ARCHIVED,
          isFavorite: true,
          stateUpdatedAt: new Date(ORIGINAL_ARCHIVED_TIME.getTime() + 1000),
          savedAt: new Date("2025-01-01T00:00:00.000Z"),
          lastReadAt: null,
        },
      ]);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com, example2-com",
          favorite: false,
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
        .where(eq(profileItems.isFavorite, false));

      expect(updatedItems).toHaveLength(2);
    });

    it("should return 200 if request body includes invalid slugs", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "test-slug",
          favorite: false,
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
          favorite: false,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 if favorite is missing", async () => {
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

    it("should return 400 if favorite is invalid", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com",
          favorite: "invalid-favorite",
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
          favorite: true,
        },
      });

      const currentItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.isFavorite, true));
      expect(currentItems).toHaveLength(1);

      const response = await POST(request);
      expect(response.status).toBe(401);

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.isFavorite, true));
      expect(updatedItems).toHaveLength(1);
    });

    it("should return 401 if no valid auth is provided", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const request: APIRequest = makeUnauthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: ["example-com"],
          favorite: false,
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
          favorite: false,
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
