import { desc, eq } from "@app/api/db";
import { DbErrorCode } from "@app/api/db/errors";
import { items, profileItemHighlights, profileItems } from "@app/api/db/schema";
import {
  MOCK_EMAIL,
  MOCK_EMAIL_DATE,
  MOCK_EMAIL_SLUG,
  MOCK_EMAIL_URL,
  parseIncomingEmail,
} from "@app/api/lib/email/__mocks__/index";
import { EmailError } from "@app/api/lib/email/types";
import { indexItemDocuments } from "@app/api/lib/search";
import {
  MOCK_VERSION,
  uploadItemContent,
} from "@app/api/lib/storage/__mocks__/index";
import { ErrorResponse } from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { MOCK_ENV } from "@app/api/utils/test/env";
import { testDb } from "@app/api/utils/test/provider";
import { UploadStatus } from "@app/schemas/types";
import { Hono } from "hono";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { publicItemsEmailRouter } from "./index";

const MOCK_SECRET = MOCK_ENV.CURIO_APP_SECRET;

vi.unmock("@app/api/lib/extract");

const MOCK_EXISTING_ITEM = {
  id: "123e4567-e89b-12d3-a456-426614174010",
  url: MOCK_EMAIL_URL,
  slug: MOCK_EMAIL_SLUG,
};

const MOCK_PROFILE_ITEMS = [
  {
    id: "1234e567-e89b-12d3-a456-426614174099",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: MOCK_EXISTING_ITEM.id,
    title: "Existing title",
    savedAt: new Date("2025-01-10T12:52:56-08:00"),
    versionName: "mock-old-version",
    stateUpdatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: "1234e567-e89b-12d3-a456-426614174098",
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    itemId: MOCK_EXISTING_ITEM.id,
    title: "Existing title 2",
    savedAt: new Date("2025-01-10T12:52:56-08:00"),
    versionName: "mock-old-version",
    stateUpdatedAt: new Date("2025-01-10T12:52:57-08:00"),
  },
];

const MOCK_HIGHLIGHTS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174010",
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    startOffset: 10,
    endOffset: 20,
    text: "highlighted text",
    note: "test note",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
];

describe("/v1/items/email", () => {
  let app: Hono<EnvBindings>;

  beforeAll(async () => {
    app = setUpMockApp("/v1/public/items/email", publicItemsEmailRouter, null);
  });

  describe("POST /v1/items/email", () => {
    const checkDocumentIndexed = (): void => {
      expect(indexItemDocuments).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        [
          {
            title: MOCK_EMAIL.subject,
            description: MOCK_EMAIL.textContent,
            author: MOCK_EMAIL.sender.name,
            content: "## Test Email HTML Content\n\nThis is my newsletter",
            contentVersionName: MOCK_VERSION,
            url: MOCK_EMAIL_URL,
            slug: MOCK_EMAIL_SLUG,
          },
        ],
      );
    };

    it("should return 200 when receiving new email content", async () => {
      const response = await postRequest(
        app,
        "v1/public/items/email",
        {
          emailBody: "dummy email",
        },
        {
          "x-curio-app-secret": MOCK_SECRET,
        },
      );

      expect(response.status).toBe(200);

      expect(uploadItemContent).toHaveBeenCalledExactlyOnceWith(
        expect.any(Object),
        MOCK_EMAIL_SLUG,
        "## Test Email HTML Content\n\nThis is my newsletter",
        {
          title: MOCK_EMAIL.subject,
          author: MOCK_EMAIL.sender.name,
          description: MOCK_EMAIL.textContent,
          thumbnail: null,
          favicon: null,
          publishedAt: MOCK_EMAIL_DATE,
        },
      );

      const data: { status: UploadStatus; slug: string } =
        await response.json();
      expect(data.status).toBe(UploadStatus.UPDATED_MAIN);
      expect(data.slug).toBe(MOCK_EMAIL_SLUG);

      const newItem = await testDb.db.select().from(profileItems);
      expect(newItem).toHaveLength(1);
      expect(newItem[0].title).toBe(MOCK_EMAIL.subject);
      expect(newItem[0].author).toBe(MOCK_EMAIL.sender.name);
      expect(newItem[0].description).toBe(MOCK_EMAIL.textContent);
      expect(newItem[0].publishedAt).toEqual(MOCK_EMAIL_DATE);
      expect(newItem[0].savedAt).not.toBe(null);
      expect(newItem[0].versionName).toBe(MOCK_VERSION);

      checkDocumentIndexed();
    });

    it("should return 400 when unable to parse incoming email", async () => {
      vi.mocked(parseIncomingEmail).mockRejectedValueOnce(
        new EmailError("Failed to parse email"),
      );

      const response = await postRequest(
        app,
        "v1/public/items/email",
        {
          emailBody: "dummy email",
        },
        {
          "x-curio-app-secret": MOCK_SECRET,
        },
      );

      expect(response.status).toBe(400);
    });

    it("should return 401 when unable to identify user from recipient email", async () => {
      vi.mocked(parseIncomingEmail).mockResolvedValueOnce({
        ...MOCK_EMAIL,
        recipient: "invalid@testmail.curi.ooo",
      });

      const response = await postRequest(
        app,
        "v1/public/items/email",
        {
          emailBody: "dummy email",
        },
        {
          "x-curio-app-secret": MOCK_SECRET,
        },
      );

      expect(response.status).toBe(401);

      const data: ErrorResponse = await response.json();
      expect(data.error).toBe("Failed to identify user from recipient email");
    });

    it("should return 401 when app secret is not provided", async () => {
      const response = await postRequest(app, "v1/public/items/email", {
        emailBody: "dummy email",
      });

      expect(response.status).toBe(401);
    });

    it("should return 401 when app secret is invalid", async () => {
      const response = await postRequest(
        app,
        "v1/public/items/email",
        {
          emailBody: "dummy email",
        },
        {
          "x-curio-app-secret": "invalid",
        },
      );

      expect(response.status).toBe(401);
    });

    it("should return 500 when database errors", async () => {
      type PgTx = Parameters<Parameters<typeof testDb.db.transaction>[0]>[0];

      vi.spyOn(testDb.db, "transaction").mockImplementationOnce(
        async (callback) => {
          return callback({
            ...testDb.db,
            insert: () => {
              throw { code: DbErrorCode.ConnectionFailure };
            },
          } as unknown as PgTx);
        },
      );

      const response = await postRequest(
        app,
        "v1/public/items/email",
        {
          emailBody: "dummy email",
        },
        {
          "x-curio-app-secret": MOCK_SECRET,
        },
      );

      expect(response.status).toBe(500);
    });

    describe("with existing item", async () => {
      beforeEach(async () => {
        await testDb.db.insert(items).values(MOCK_EXISTING_ITEM);
        await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
        await testDb.db.insert(profileItemHighlights).values(MOCK_HIGHLIGHTS);
      });

      it("should return 200 when receiving duplicate email content", async () => {
        vi.mocked(uploadItemContent).mockResolvedValueOnce({
          versionName: MOCK_VERSION,
          status: UploadStatus.SKIPPED,
        });

        const response = await postRequest(
          app,
          "v1/public/items/email",
          {
            emailBody: "dummy email",
          },
          {
            "x-curio-app-secret": MOCK_SECRET,
          },
        );

        expect(response.status).toBe(200);

        const data: { status: UploadStatus; slug: string } =
          await response.json();
        expect(data.status).toBe(UploadStatus.SKIPPED);
        expect(data.slug).toBe(MOCK_EMAIL_SLUG);

        const item = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID));
        expect(item).toHaveLength(1);
        expect(item[0].title).toBe(MOCK_EMAIL.subject);
        expect(item[0].versionName).toBe(MOCK_VERSION);
        expect(indexItemDocuments).not.toHaveBeenCalled();
      });

      it("should return 200 when receiving shorter email content", async () => {
        vi.mocked(uploadItemContent).mockResolvedValueOnce({
          versionName: MOCK_VERSION,
          status: UploadStatus.STORED_VERSION,
        });

        const response = await postRequest(
          app,
          "v1/public/items/email",
          {
            emailBody: "dummy email",
          },
          {
            "x-curio-app-secret": MOCK_SECRET,
          },
        );

        expect(response.status).toBe(200);

        const data: { status: UploadStatus; slug: string } =
          await response.json();
        expect(data.status).toBe(UploadStatus.STORED_VERSION);
        expect(data.slug).toBe(MOCK_EMAIL_SLUG);

        const item = await testDb.db
          .select()
          .from(profileItems)
          .where(eq(profileItems.profileId, DEFAULT_TEST_PROFILE_ID));
        expect(item).toHaveLength(1);
        expect(item[0].title).toBe(MOCK_EMAIL.subject);
        expect(item[0].versionName).toBe(MOCK_VERSION);
        const highlights = await testDb.db.select().from(profileItemHighlights);
        expect(highlights).toHaveLength(0);
        expect(indexItemDocuments).not.toHaveBeenCalled();
      });

      it("should return 200 when receiving longer email content", async () => {
        const response = await postRequest(
          app,
          "v1/public/items/email",
          {
            emailBody: "dummy email",
          },
          {
            "x-curio-app-secret": MOCK_SECRET,
          },
        );

        expect(response.status).toBe(200);

        const data: { status: UploadStatus; slug: string } =
          await response.json();
        expect(data.status).toBe(UploadStatus.UPDATED_MAIN);
        expect(data.slug).toBe(MOCK_EMAIL_SLUG);

        const item = await testDb.db
          .select()
          .from(profileItems)
          .orderBy(desc(profileItems.id));
        expect(item).toHaveLength(2);
        expect(item[0].title).toBe(MOCK_EMAIL.subject);
        expect(item[0].versionName).toBe(MOCK_VERSION);
        expect(item[1].title).toBe("Existing title 2");
        expect(item[1].versionName).toBe("mock-old-version");
        const highlights = await testDb.db.select().from(profileItemHighlights);
        expect(highlights).toHaveLength(0);
        checkDocumentIndexed();
      });
    });
  });
});
