import { vi } from "vitest";

import { eq } from "@web/db";
import { items, profileItems } from "@web/db/schema";
import { getItemContent, getItemMetadata } from "@web/lib/storage";
import { MOCK_VERSION } from "@web/lib/storage/__mocks__/index";
import { StorageError } from "@web/lib/storage/types";
import { APIRequest } from "@web/utils/api";
import { makeAuthenticatedMockRequest } from "@web/utils/test/api";
import {
  MOCK_ITEMS,
  MOCK_PROFILE_ITEMS,
  NONEXISTENT_USER_ID,
} from "@web/utils/test/data";
import { testDb } from "@web/utils/test/provider";

import { POST } from "./route";

const MOCK_ITEM = MOCK_ITEMS[1];
const MOCK_PROFILE_ITEM = MOCK_PROFILE_ITEMS[1];
const MOCK_PROFILE_ITEM_WITH_VERSION = {
  ...MOCK_PROFILE_ITEMS[1],
  versionName: MOCK_VERSION,
};
const MOCK_SLUG = "example2-com";

describe("/api/v1/items/read", () => {
  describe("POST /api/v1/items/read", () => {
    it("should return 200 when reading version name via regular auth", async () => {
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db
        .insert(profileItems)
        .values(MOCK_PROFILE_ITEM_WITH_VERSION);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: { slug: MOCK_SLUG, readingProgress: 50 },
      });

      const response = await POST(request);
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

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: { slug: MOCK_SLUG, readingProgress: 24 },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        slug: MOCK_SLUG,
        readingProgress: 24,
        versionName: MOCK_VERSION,
      });
      expect(getItemMetadata).toHaveBeenCalledTimes(1);
      expect(getItemMetadata).toHaveBeenCalledWith(MOCK_SLUG);

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
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: { slug: "example3-com", readingProgress: 50 },
      });

      const response = await POST(request);
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

    it("should return 401 if user profile not found", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        userId: NONEXISTENT_USER_ID,
        body: { slug: "example-com", readingProgress: 24 },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 404 if item not found", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: { slug: "nonexistent", readingProgress: 24 },
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Item not found.");
    });

    it("should return 400 if slug is missing", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: { slug: "", readingProgress: 24 },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("No slug provided.");
    });

    it("should return 500 if fails to fetch storage metadata", async () => {
      vi.mocked(getItemMetadata).mockRejectedValueOnce(
        new StorageError("Failed to verify metadata contents"),
      );
      await testDb.db.insert(items).values(MOCK_ITEM);
      await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEM);

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: { slug: MOCK_SLUG, readingProgress: 24 },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Error reading item.");
    });
  });
});
