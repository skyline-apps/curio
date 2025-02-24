import { vi } from "vitest";

import { desc, eq } from "@/db";
import { profileLabels } from "@/db/schema";
import { APIRequest } from "@/utils/api";
import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  makeAuthenticatedMockRequest,
} from "@/utils/test/api";
import { testDb } from "@/utils/test/provider";

import { DELETE, GET, POST } from "./route";

const MOCK_LABEL_ID_1 = "123e4567-e89b-12d3-a456-426614174999";
const MOCK_LABEL_ID_2 = "123e4567-e89b-12d3-a456-426614174998";
const MOCK_LABEL_ID_3 = "123e4567-e89b-12d3-a456-426614174997";
const ORIGINAL_TIME = new Date("2025-01-10T12:52:56-08:00");

const MOCK_LABELS = [
  {
    id: MOCK_LABEL_ID_1,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Work",
    color: "#FF0000",
    createdAt: ORIGINAL_TIME,
    updatedAt: ORIGINAL_TIME,
  },
  {
    id: MOCK_LABEL_ID_2,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Personal",
    color: "#00FF00",
    createdAt: ORIGINAL_TIME,
    updatedAt: ORIGINAL_TIME,
  },
  {
    id: MOCK_LABEL_ID_3,
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    name: "Ghost",
    color: "#FFFFFF",
    createdAt: ORIGINAL_TIME,
    updatedAt: ORIGINAL_TIME,
  },
];

describe("/api/v1/user/labels", () => {
  beforeEach(async () => {
    await testDb.db.insert(profileLabels).values(MOCK_LABELS);
  });

  describe("GET /api/v1/user/labels", () => {
    test.each([
      ["should return 200 with labels via regular auth", ""],
      ["should return 200 with labels via api key", DEFAULT_TEST_API_KEY],
    ])("%s", async (_, apiKey) => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
        apiKey: apiKey,
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.labels).toHaveLength(2);
      expect(data.labels).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: MOCK_LABEL_ID_1,
            name: "Work",
            color: "#FF0000",
          }),
          expect.objectContaining({
            id: MOCK_LABEL_ID_2,
            name: "Personal",
            color: "#00FF00",
          }),
        ]),
      );
    });

    it("should return 500 if database query fails", async () => {
      vi.spyOn(testDb.db, "select").mockImplementationOnce(() => {
        throw new Error("Database connection failed");
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: "Error fetching labels." });
    });
  });

  describe("POST /api/v1/user/labels", () => {
    it("should return 200 when creating and updating labels", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          labels: [
            { name: "New Label", color: "#0000FF" },
            { id: MOCK_LABEL_ID_1, name: "Updated Label", color: "#00FF00" },
            { id: MOCK_LABEL_ID_3, name: "Not my label", color: "#FFFFF0" },
          ],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.labels).toHaveLength(2);
      expect(data.labels).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: "New Label",
            color: "#0000FF",
          }),
          expect.objectContaining({
            id: MOCK_LABEL_ID_1,
            name: "Updated Label",
            color: "#00FF00",
          }),
        ]),
      );

      const updatedLabels = await testDb.db
        .select()
        .from(profileLabels)
        .where(eq(profileLabels.profileId, DEFAULT_TEST_PROFILE_ID))
        .orderBy(desc(profileLabels.name));

      expect(updatedLabels).toHaveLength(3);
      expect(updatedLabels[0].name).toBe("Updated Label");
      expect(
        (updatedLabels[0].updatedAt as Date).getTime() >
          ORIGINAL_TIME.getTime(),
      ).toBe(true);
      expect(updatedLabels[1].name).toBe("Personal");
      expect(updatedLabels[2].name).toBe("New Label");
    });

    it("should return 200 and preserve existing values", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          labels: [{ id: MOCK_LABEL_ID_1, name: "Updated Label" }],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.labels).toHaveLength(1);
      expect(data.labels).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: MOCK_LABEL_ID_1,
            name: "Updated Label",
            color: "#FF0000",
          }),
        ]),
      );

      const updatedLabels = await testDb.db
        .select()
        .from(profileLabels)
        .where(eq(profileLabels.profileId, DEFAULT_TEST_PROFILE_ID));

      expect(updatedLabels).toHaveLength(2);
    });

    it("should return 200 for label name only used by another user", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          labels: [{ name: "Ghost", color: "#0000FF" }],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it("should return 400 for invalid label name", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          labels: [{ name: "", color: "#00F0F0" }],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    it("should return 400 for duplicate label name", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          labels: [{ name: "Personal", color: "#0000FF" }],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Label name already in use.");
    });

    it("should return 500 if database insert fails", async () => {
      vi.spyOn(testDb.db, "insert").mockImplementationOnce(() => {
        throw new Error("Database insert failed");
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "POST",
        body: {
          labels: [{ name: "New Label", color: "#0000FF" }],
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: "Error updating labels." });
    });
  });

  describe("DELETE /api/v1/user/labels", () => {
    it("should return 200 when deleting labels", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          ids: [MOCK_LABEL_ID_1, MOCK_LABEL_ID_2, MOCK_LABEL_ID_3],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.deleted).toBe(2);

      const remainingLabels = await testDb.db.select().from(profileLabels);

      expect(remainingLabels).toHaveLength(1);
      expect(remainingLabels[0].id).toBe(MOCK_LABEL_ID_3);
    });

    it("should return 404 if no labels are deleted", async () => {
      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          ids: [MOCK_LABEL_ID_3],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toEqual({ error: "Labels not found." });
    });

    it("should return 500 if database delete fails", async () => {
      vi.spyOn(testDb.db, "delete").mockImplementationOnce(() => {
        throw new Error("Database delete failed");
      });

      const request: APIRequest = makeAuthenticatedMockRequest({
        method: "DELETE",
        body: {
          ids: [MOCK_LABEL_ID_1],
        },
      });

      const response = await DELETE(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: "Error deleting labels." });
    });
  });
});
