import { eq } from "@/db";
import {
  items,
  profileItemLabels,
  profileItems,
  profileLabels,
} from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { DELETE, POST } from "./route";

const TEST_ITEM_ID_1 = "123e4567-e89b-12d3-a456-426614174001";
const TEST_ITEM_ID_2 = "123e4567-e89b-12d3-a456-426614174002";
const TEST_ITEM_ID_3 = "123e4567-e89b-12d3-a456-426614174003";
const TEST_PROFILE_ITEM_ID_1 = "123e4567-e89b-12d3-a456-426614174009";
const TEST_PROFILE_ITEM_ID_2 = "123e4567-e89b-12d3-a456-426614174008";
const TEST_PROFILE_ITEM_ID_3 = "123e4567-e89b-12d3-a456-426614174007";

const MOCK_ITEMS = [
  {
    id: TEST_ITEM_ID_1,
    url: "https://example.com/1",
    slug: "example-com-1",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_2,
    url: "https://example.com/2",
    slug: "example-com-2",
    createdAt: new Date("2025-01-10T12:53:56-08:00"),
    updatedAt: new Date("2025-01-10T12:53:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_3,
    url: "https://example.com/3",
    slug: "example-com-3",
    createdAt: new Date("2025-01-10T12:53:56-08:00"),
    updatedAt: new Date("2025-01-10T12:53:56-08:00"),
  },
];

const MOCK_PROFILE_ITEMS = [
  {
    id: TEST_PROFILE_ITEM_ID_1,
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_1,
    title: "Example 1",
  },
  {
    id: TEST_PROFILE_ITEM_ID_2,
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_2,
    title: "Example 2",
  },
  {
    id: TEST_PROFILE_ITEM_ID_3,
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    itemId: TEST_ITEM_ID_2,
    title: "Not mine",
  },
];

const MOCK_LABEL_ID_1 = "123e4567-e89b-12d3-a456-426614174012";
const MOCK_LABEL_ID_2 = "123e4567-e89b-12d3-a456-426614174014";
const MOCK_LABEL_ID_3 = "123e4567-e89b-12d3-a456-426614174016";

const MOCK_LABELS = [
  {
    id: MOCK_LABEL_ID_1,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Test label",
    color: "#FFFFFF",
  },
  {
    id: MOCK_LABEL_ID_2,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Another label",
    color: "#000000",
  },
  {
    id: MOCK_LABEL_ID_3,
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    name: "Not my label",
    color: "#010101",
  },
];

describe("/api/v1/items/labels", () => {
  beforeEach(async () => {
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
    await testDb.db.insert(profileLabels).values(MOCK_LABELS);
  });

  describe("POST /api/v1/items/labels", () => {
    test.each([
      ["should return 200 adding labels via regular auth", ""],
      ["should return 200 adding labels via api key", DEFAULT_TEST_API_KEY],
    ])("%s", async (_, apiKey) => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        apiKey: apiKey,
        body: {
          slugs: "example-com-1,example-com-2",
          labelIds: [MOCK_LABEL_ID_1, MOCK_LABEL_ID_2],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example-com-1" }, { slug: "example-com-2" }],
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
            labelId: MOCK_LABEL_ID_1,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: MOCK_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: MOCK_LABEL_ID_1,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: MOCK_LABEL_ID_2,
          },
        ]),
      );
    });

    it("should return 200 but not add label if item is not owned by profile", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "example-com-3,example-com-2",
          labelIds: [MOCK_LABEL_ID_2],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        updated: [{ slug: "example-com-2" }],
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
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: MOCK_LABEL_ID_2,
          },
        ]),
      );
    });

    it("should return 400 if no slugs are provided", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          slugs: "",
          labelIds: [MOCK_LABEL_ID_1],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "No slugs provided." });
    });
  });

  describe("DELETE /api/v1/items/labels", () => {
    beforeEach(async () => {
      await testDb.db.insert(profileItemLabels).values([
        {
          profileItemId: TEST_PROFILE_ITEM_ID_1,
          labelId: MOCK_LABEL_ID_1,
        },
        {
          profileItemId: TEST_PROFILE_ITEM_ID_1,
          labelId: MOCK_LABEL_ID_2,
        },
        {
          profileItemId: TEST_PROFILE_ITEM_ID_2,
          labelId: MOCK_LABEL_ID_2,
        },
        {
          profileItemId: TEST_PROFILE_ITEM_ID_3,
          labelId: MOCK_LABEL_ID_3,
        },
      ]);
    });
    test.each([
      ["should return 200 deleting labels via regular auth", ""],
      ["should return 200 deleting labels via api key", DEFAULT_TEST_API_KEY],
    ])("%s", async (_, apiKey) => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        apiKey: apiKey,
        body: {
          slugs: "example-com-1",
          labelIds: [MOCK_LABEL_ID_1],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        deleted: [{ slug: "example-com-1" }],
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

      expect(newLabels.length).toEqual(3);
      expect(newLabels).toEqual(
        expect.arrayContaining([
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: MOCK_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: MOCK_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_3,
            labelId: MOCK_LABEL_ID_3,
          },
        ]),
      );
    });

    it("should return 200 after deleting multiple profile item labels", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slugs: "example-com-1,example-com-2",
          labelIds: [MOCK_LABEL_ID_1, MOCK_LABEL_ID_2],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        deleted: [{ slug: "example-com-1" }, { slug: "example-com-2" }],
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
            profileItemId: TEST_PROFILE_ITEM_ID_3,
            labelId: MOCK_LABEL_ID_3,
          },
        ]),
      );
    });

    it("should return 200 but not deleting profile item label that does not belong to profile", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slugs: "example-com-3",
          labelIds: [MOCK_LABEL_ID_3],
        },
      });

      const response = await DELETE(request);
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
        );

      expect(newLabels.length).toEqual(4);
      expect(newLabels).toEqual(
        expect.arrayContaining([
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: MOCK_LABEL_ID_1,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_1,
            labelId: MOCK_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_2,
            labelId: MOCK_LABEL_ID_2,
          },
          {
            profileItemId: TEST_PROFILE_ITEM_ID_3,
            labelId: MOCK_LABEL_ID_3,
          },
        ]),
      );
    });

    it("should return 400 if no slugs are provided", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          slugs: "",
          labelIds: [MOCK_LABEL_ID_1],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "No slugs provided." });
    });
  });
});
