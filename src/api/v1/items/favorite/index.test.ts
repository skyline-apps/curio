import { eq } from "@api/db";
import { DbErrorCode } from "@api/db/errors";
import { items, profileItems } from "@api/db/schema";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  postRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  TEST_ITEM_ID_1,
  TEST_ITEM_ID_2,
} from "@api/utils/test/data";
import { testDb } from "@api/utils/test/provider";
import { ItemState } from "@shared/db";
import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { itemsFavoriteRouter } from "./index";

const ORIGINAL_ARCHIVED_TIME = new Date("2025-01-10T12:52:56-08:00");

describe("/v1/items/favorite", () => {
  let app: Hono<EnvBindings>;
  describe("POST /v1/items/favorite", () => {
    beforeAll(async () => {
      app = setUpMockApp("/v1/items/favorite", itemsFavoriteRouter);
    });
    it("should return 200 favoriting items via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);

      const response = await postRequest(app, "v1/items/favorite", {
        slugs: "example2-com,example3-com",
        favorite: true,
      });

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
      const response = await postRequest(app, "v1/items/favorite", {
        slugs: "example-com, example2-com",
        favorite: false,
      });

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
      const response = await postRequest(app, "v1/items/favorite", {
        slugs: "test-slug",
        favorite: false,
      });

      expect(response.status).toBe(200);
    });

    it("should return 400 if slugs are missing", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const response = await postRequest(app, "v1/items/favorite", {
        slugs: "",
        favorite: false,
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 if favorite is missing", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const response = await postRequest(app, "v1/items/favorite", {
        slugs: "example-com",
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 if favorite is invalid", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const response = await postRequest(app, "v1/items/favorite", {
        slugs: "example-com",
        favorite: "invalid-favorite",
      });

      expect(response.status).toBe(400);
    });

    it("should return 500 if database error occurs", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      vi.spyOn(testDb.db, "update").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });
      const response = await postRequest(app, "v1/items/favorite", {
        slugs: "example-com",
        favorite: false,
      });
      expect(response.status).toBe(500);
    });
  });
});
