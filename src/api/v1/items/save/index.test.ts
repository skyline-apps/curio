import { eq } from "@api/db";
import { DbErrorCode } from "@api/db/errors";
import { items, ItemState, profileItems } from "@api/db/schema";
import { getItemMetadata } from "@api/lib/storage/__mocks__/index";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  DEFAULT_TEST_USER_ID_2,
  postRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  TEST_ITEM_ID_1,
  TEST_ITEM_ID_2,
  TEST_ITEM_ID_3,
  TEST_ITEM_ID_DELETED,
} from "@api/utils/test/data";
import { testDb } from "@api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { itemsSaveRouter } from "./index";
import { SaveResponse } from "./validation";

describe("/v1/items/save", () => {
  let app: Hono<EnvBindings>;
  describe("POST /v1/items/save", () => {
    beforeEach(async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    });

    describe("main user", () => {
      beforeAll(() => {
        app = setUpMockApp("/v1/items/save", itemsSaveRouter);
      });
      it("should return 200 when item is already saved", async () => {
        const originalItem = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.id, MOCK_PROFILE_ITEMS[1].id));
        const originalSavedAt = originalItem[0].savedAt;

        const response = await postRequest(app, "v1/items/save", {
          slugs: "example2-com",
        });
        expect(response.status).toBe(200);

        const data: SaveResponse = await response.json();
        expect(data.updated).toEqual([]);

        const updatedItems = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID))
          .orderBy(profileItems.itemId);
        expect(updatedItems).toHaveLength(4);
        expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_2);
        expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_1);
        expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
        expect(updatedItems[3].itemId).toBe(TEST_ITEM_ID_DELETED);
        expect(updatedItems[0].savedAt).toEqual(originalSavedAt);
      });

      it("should return 200 and only save unsaved items", async () => {
        const originalItem = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.id, MOCK_PROFILE_ITEMS[2].id));
        const originalStateUpdatedAt = originalItem[0].stateUpdatedAt;

        const response = await postRequest(app, "v1/items/save", {
          slugs: "example2-com,example3-com",
        });
        expect(response.status).toBe(200);

        const data: SaveResponse = await response.json();
        expect(data.updated).toEqual([
          { slug: "example3-com", profileItemId: expect.any(String) },
        ]);

        const updatedItems = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID))
          .orderBy(profileItems.itemId);
        expect(updatedItems).toHaveLength(4);
        expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_2);
        expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_1);
        expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
        expect(updatedItems[2].state).toBe(ItemState.ACTIVE);
        expect(updatedItems[2].stateUpdatedAt).not.toEqual(
          originalStateUpdatedAt,
        );
        expect(updatedItems[3].itemId).toBe(TEST_ITEM_ID_DELETED);
      });

      it("should return 200 and update all saved items to active", async () => {
        const response = await postRequest(app, "v1/items/save", {
          slugs: "example-com,example2-com,example3-com,example4-com",
        });
        expect(response.status).toBe(200);

        const data: SaveResponse = await response.json();
        expect(data.updated).toEqual([
          {
            slug: "example-com",
            profileItemId: MOCK_PROFILE_ITEMS[0].id,
          },
          { slug: "example3-com", profileItemId: expect.any(String) },
          {
            slug: "example4-com",
            profileItemId: MOCK_PROFILE_ITEMS[3].id,
          },
        ]);

        const updatedItems = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID))
          .orderBy(profileItems.itemId);
        expect(updatedItems).toHaveLength(4);
        expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_2);
        expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_1);
        expect(updatedItems[2].itemId).toBe(TEST_ITEM_ID_3);
        expect(updatedItems[3].itemId).toBe(TEST_ITEM_ID_DELETED);
        updatedItems.forEach((item) =>
          expect(item.state).toBe(ItemState.ACTIVE),
        );
      });

      it("should return 200 on invalid slugs", async () => {
        const response = await postRequest(app, "v1/items/save", {
          slugs: "example3-com,invalid-slug",
        });
        expect(response.status).toBe(200);

        const data: SaveResponse = await response.json();
        expect(data.updated).toEqual([
          { slug: "example3-com", profileItemId: expect.any(String) },
        ]);
      });

      it("should return 400 if request body is invalid", async () => {
        const response = await postRequest(app, "v1/items/save", {
          slugs: [],
        });
        expect(response.status).toBe(400);
      });

      it("should return 500 if database error occurs", async () => {
        vi.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
          throw { code: DbErrorCode.ConnectionFailure };
        });

        const response = await postRequest(app, "v1/items/save", {
          slugs: "example-com,example2-com,example3-com,example4-com",
        });
        expect(response.status).toBe(500);
      });
    });

    describe("secondary user", () => {
      beforeAll(() => {
        app = setUpMockApp(
          "/v1/items/save",
          itemsSaveRouter,
          DEFAULT_TEST_USER_ID_2,
        );
      });

      it("should return 200 when saving an item", async () => {
        const response = await postRequest(app, "v1/items/save", {
          slugs: "example-com",
        });

        expect(response.status).toBe(200);

        const data: SaveResponse = await response.json();
        expect(data.updated).toEqual([
          { slug: "example-com", profileItemId: expect.any(String) },
        ]);

        const updatedItems = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID_2))
          .orderBy(profileItems.itemId);
        expect(updatedItems).toHaveLength(2);
        expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_1);
        expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_3);
        expect(
          (updatedItems[0].savedAt as Date).getTime() >
            (updatedItems[1].savedAt as Date).getTime(),
        ).toBe(true);
      });

      it("should return 200 when saving an item with publishedAt", async () => {
        getItemMetadata.mockResolvedValueOnce({
          title: "Blank title",
          publishedAt: "2023-01-01T00:00:00.000Z",
        });

        const response = await postRequest(app, "v1/items/save", {
          slugs: "example-com",
        });
        expect(response.status).toBe(200);

        const data: SaveResponse = await response.json();
        expect(data.updated).toEqual([
          { slug: "example-com", profileItemId: expect.any(String) },
        ]);

        const updatedItems = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID_2))
          .orderBy(profileItems.itemId);
        expect(updatedItems).toHaveLength(2);
        expect(updatedItems[0].itemId).toBe(TEST_ITEM_ID_1);
        expect(updatedItems[1].itemId).toBe(TEST_ITEM_ID_3);
        expect(
          (updatedItems[0].savedAt as Date).getTime() >
            (updatedItems[1].savedAt as Date).getTime(),
        ).toBe(true);
      });

      it("should return 200 when user has no items", async () => {
        const response = await postRequest(app, "v1/items/save", {
          slugs: "example-com",
        });
        expect(response.status).toBe(200);

        const data: SaveResponse = await response.json();
        expect(data.updated).toEqual([
          { slug: "example-com", profileItemId: expect.any(String) },
        ]);
      });
    });
  });
});
