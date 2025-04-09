import { eq } from "@app/api/db";
import { items, profileItems } from "@app/api/db/schema";
import { getItemContent, getItemMetadata } from "@app/api/lib/storage";
import { MOCK_VERSION } from "@app/api/lib/storage/__mocks__/index";
import { StorageError } from "@app/api/lib/storage/types";
import { ErrorResponse } from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import { postRequest, setUpMockApp } from "@app/api/utils/test/api";
import { MOCK_ITEMS, MOCK_PROFILE_ITEMS } from "@app/api/utils/test/data";
import { testDb } from "@app/api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { itemsReadRouter } from "./index";

const MOCK_ITEM = MOCK_ITEMS[1];
const MOCK_PROFILE_ITEM = MOCK_PROFILE_ITEMS[1];
const MOCK_PROFILE_ITEM_WITH_VERSION = {
  ...MOCK_PROFILE_ITEMS[1],
  versionName: MOCK_VERSION,
};
const MOCK_SLUG = "example2-com";

describe("/v1/items/read", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/items/read", itemsReadRouter);
  });
  describe("POST /v1/items/read", () => {
    it("should return 200 when reading version name via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db
        .insert(profileItems)
        .values(MOCK_PROFILE_ITEM_WITH_VERSION);

      const response = await postRequest(app, "v1/items/read", {
        slug: MOCK_SLUG,
        readingProgress: 50,
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: MOCK_SLUG,
        readingProgress: 50,
        versionName: MOCK_VERSION,
      });
      expect(getItemMetadata).not.toHaveBeenCalled();

      const updatedItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.id, MOCK_PROFILE_ITEM_WITH_VERSION.id))
        .limit(1)
        .execute();

      expect(updatedItem[0].versionName).toBe(MOCK_VERSION);
      expect(updatedItem[0].readingProgress).toBe(50);
    });

    it("should return 200 and update version name when default is set", async () => {
      vi.mocked(getItemContent).mockResolvedValueOnce({
        version: "2010-04-04",
        versionName: "2010-04-04",
        content: "custom version content",
      });
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values({
        ...MOCK_PROFILE_ITEM,
        readingProgress: 5,
        lastReadAt: new Date("2015-02-10T12:50:00-08:00"),
      });

      const response = await postRequest(app, "v1/items/read", {
        slug: MOCK_SLUG,
        readingProgress: 24,
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: MOCK_SLUG,
        readingProgress: 24,
        versionName: MOCK_VERSION,
      });
      expect(getItemMetadata).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        MOCK_SLUG,
      );

      const updatedItem = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.id, MOCK_PROFILE_ITEM.id))
        .limit(1)
        .execute();

      expect(updatedItem[0].versionName).toBe(MOCK_VERSION);
      expect(
        (updatedItem[0].lastReadAt as Date).getTime() >
          new Date("2015-02-10T12:50:00-08:00").getTime(),
      ).toBe(true);
    });

    it("should return 200 and not update items for other users", async () => {
      await testDb.db.insert(items).values(MOCK_ITEMS);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
      const response = await postRequest(app, "v1/items/read", {
        slug: "example3-com",
        readingProgress: 50,
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: "example3-com",
        readingProgress: 50,
        versionName: MOCK_PROFILE_ITEMS[2].versionName,
      });
      expect(getItemMetadata).not.toHaveBeenCalled();

      const updatedItems = await testDb.db
        .select()
        .from(profileItems)
        .where(eq(profileItems.itemId, MOCK_ITEMS[2].id))
        .orderBy(profileItems.title);

      expect(updatedItems).toHaveLength(2);
      expect(updatedItems[0].versionName).toBe(
        MOCK_PROFILE_ITEMS[2].versionName,
      );
      expect(updatedItems[0].readingProgress).toBe(50);
      expect(updatedItems[1].versionName).toBe(null);
      expect(updatedItems[1].readingProgress).toBe(0);
    });

    it("should return 404 if item not found", async () => {
      const response = await postRequest(app, "v1/items/read", {
        slug: "nonexistent",
        readingProgress: 24,
      });
      expect(response.status).toBe(404);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Item not found.");
    });

    it("should return 400 if slug is missing", async () => {
      const response = await postRequest(app, "v1/items/read", {
        readingProgress: 24,
      });
      expect(response.status).toBe(400);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Invalid request parameters:\nslug: Required");
    });

    it("should return 400 if slug is empty", async () => {
      const response = await postRequest(app, "v1/items/read", {
        readingProgress: 24,
        slug: "",
      });
      expect(response.status).toBe(400);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe(
        "Invalid request parameters:\nslug: String must contain at least 1 character(s)",
      );
    });

    it("should return 500 if fails to fetch storage metadata", async () => {
      vi.mocked(getItemMetadata).mockRejectedValueOnce(
        new StorageError("Failed to verify metadata contents"),
      );
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

      const response = await postRequest(app, "v1/items/read", {
        slug: MOCK_SLUG,
        readingProgress: 24,
      });
      expect(response.status).toBe(500);
      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Error reading item.");
    });
  });
});
