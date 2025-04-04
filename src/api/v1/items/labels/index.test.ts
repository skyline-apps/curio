import { eq } from "@api/db";
import {
  items,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@api/db/schema";
import { EnvBindings } from "@api/utils/env";
import {
  DEFAULT_TEST_USER_ID_2,
  deleteRequest,
  postRequest,
  setUpMockApp,
} from "@api/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_LABELS,
  MOCK_PROFILE_ITEMS,
  TEST_LABEL_ID_1,
  TEST_LABEL_ID_2,
  TEST_LABEL_ID_3,
} from "@api/utils/test/data";
import { testDb } from "@api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { itemsLabelsRouter } from "./index";

const TEST_PROFILE_ITEM_ID_1 = MOCK_PROFILE_ITEMS[0].id;
const TEST_PROFILE_ITEM_ID_2 = MOCK_PROFILE_ITEMS[1].id;
const TEST_OTHER_PROFILE_ITEM_ID = MOCK_PROFILE_ITEMS[4].id;

describe("/api/v1/items/labels", () => {
  let app: Hono<EnvBindings>;
  beforeEach(async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    await testDb.db.insert(profileLabels).values(MOCK_LABELS);
  });

  describe("POST /api/v1/items/labels", () => {
    beforeAll(async () => {
      app = setUpMockApp("/v1/items/labels", itemsLabelsRouter);
    });

    it("should return 200 adding labels via regular auth", async () => {
      const response = await postRequest(app, "v1/items/labels", {
        slugs: "example-com,example2-com",
        labelIds: [TEST_LABEL_ID_1, TEST_LABEL_ID_2],
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example2-com" }, { slug: "example-com" }],
      });

      const newLabels = await testDb.db
        .select({
          profileItemId: profileItemLabels.profileItemId,
          labelId: profileItemLabels.labelId,
        })
        .from(profileItemLabels)
        .innerJoin(
          profileItems,
          eq(profileItems.id, profileItemLabels.profileItemId),
        );

      expect(newLabels.length).toEqual(4);
      expect(newLabels).toEqual(
        expect.arrayContaining([
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: TEST_LABEL_ID_1,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: TEST_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: TEST_LABEL_ID_1,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: TEST_LABEL_ID_2,
          },
        ]),
      );
    });

    it("should return 404 if invalid slugs are provided", async () => {
      const response = await postRequest(app, "v1/items/labels", {
        slugs: "invalid-slug",
        labelIds: [TEST_LABEL_ID_1],
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "No valid labels provided." });
    });

    it("should return 400 if no slugs are provided", async () => {
      const response = await postRequest(app, "v1/items/labels", {
        slugs: "",
        labelIds: [TEST_LABEL_ID_1],
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "No slugs provided." });
    });

    it("should return 200 but not add label if item is not owned by profile", async () => {
      app = setUpMockApp(
        "/v1/items/labels",
        itemsLabelsRouter,
        DEFAULT_TEST_USER_ID_2,
      );
      const response = await postRequest(app, "v1/items/labels", {
        slugs: "example2-com,example3-com",
        labelIds: [TEST_LABEL_ID_2],
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example3-com" }],
      });

      const newLabels = await testDb.db
        .select({
          profileItemId: profileItemLabels.profileItemId,
          labelId: profileItemLabels.labelId,
        })
        .from(profileItemLabels)
        .innerJoin(
          profileItems,
          eq(profileItems.id, profileItemLabels.profileItemId),
        );

      expect(newLabels.length).toEqual(1);
      expect(newLabels).toEqual(
        expect.arrayContaining([
          {
            profileItemId: TEST_OTHER_PROFILE_ITEM_ID,
            labelId: TEST_LABEL_ID_2,
          },
        ]),
      );
    });
  });

  describe("DELETE /api/v1/items/labels", () => {
    beforeAll(async () => {
      app = setUpMockApp("/v1/items/labels", itemsLabelsRouter);
    });
    beforeEach(async () => {
      await testDb.db.insert(profileItemLabels).values([
        {
          profileItemId: TEST_PROFILE_ITEM_ID_1,
          labelId: TEST_LABEL_ID_1,
        },
        {
          profileItemId: TEST_PROFILE_ITEM_ID_1,
          labelId: TEST_LABEL_ID_2,
        },
        {
          profileItemId: TEST_PROFILE_ITEM_ID_2,
          labelId: TEST_LABEL_ID_2,
        },
        {
          profileItemId: TEST_OTHER_PROFILE_ITEM_ID,
          labelId: TEST_LABEL_ID_3,
        },
      ]);
    });
    it("should return 200 deleting labels via regular auth", async () => {
      const response = await deleteRequest(app, "v1/items/labels", {
        slugs: "example-com",
        labelIds: [TEST_LABEL_ID_1],
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        deleted: [{ slug: "example-com" }],
      });

      const newLabels = await testDb.db
        .select({
          profileItemId: profileItemLabels.profileItemId,
          labelId: profileItemLabels.labelId,
        })
        .from(profileItemLabels)
        .innerJoin(
          profileItems,
          eq(profileItems.id, profileItemLabels.profileItemId),
        )
        .orderBy(profileItemLabels.profileItemId);

      expect(newLabels.length).toEqual(3);
      expect(newLabels).toEqual(
        expect.arrayContaining([
          {
            profileItemId: TEST_OTHER_PROFILE_ITEM_ID,
            labelId: TEST_LABEL_ID_3,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: TEST_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: TEST_LABEL_ID_2,
          },
        ]),
      );
    });

    it("should return 200 after deleting multiple profile item labels", async () => {
      const response = await deleteRequest(app, "v1/items/labels", {
        slugs: "example-com,example2-com",
        labelIds: [TEST_LABEL_ID_1, TEST_LABEL_ID_2],
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        deleted: [{ slug: "example2-com" }, { slug: "example-com" }],
      });

      const newLabels = await testDb.db
        .select({
          profileItemId: profileItemLabels.profileItemId,
          labelId: profileItemLabels.labelId,
        })
        .from(profileItemLabels)
        .innerJoin(
          profileItems,
          eq(profileItems.id, profileItemLabels.profileItemId),
        );

      expect(newLabels.length).toEqual(1);
      expect(newLabels).toEqual(
        expect.arrayContaining([
          {
            profileItemId: TEST_OTHER_PROFILE_ITEM_ID,
            labelId: TEST_LABEL_ID_3,
          },
        ]),
      );
    });

    it("should return 200 but not delete profile item label that does not belong to profile", async () => {
      const response = await deleteRequest(app, "v1/items/labels", {
        slugs: "example3-com",
        labelIds: [TEST_LABEL_ID_3],
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        deleted: [],
      });

      const newLabels = await testDb.db
        .select({
          profileItemId: profileItemLabels.profileItemId,
          labelId: profileItemLabels.labelId,
        })
        .from(profileItemLabels)
        .innerJoin(
          profileItems,
          eq(profileItems.id, profileItemLabels.profileItemId),
        )
        .orderBy(profileItemLabels.profileItemId);

      expect(newLabels.length).toEqual(4);
      expect(newLabels).toEqual(
        expect.arrayContaining([
          {
            profileItemId: TEST_OTHER_PROFILE_ITEM_ID,
            labelId: TEST_LABEL_ID_3,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: TEST_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: TEST_LABEL_ID_1,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: TEST_LABEL_ID_2,
          },
        ]),
      );
    });

    it("should return 400 if no slugs are provided", async () => {
      const response = await deleteRequest(app, "v1/items/labels", {
        slugs: "",
        labelIds: [TEST_LABEL_ID_1],
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "No slugs provided." });
    });
  });
});
