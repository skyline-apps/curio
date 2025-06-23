import { items, profileItems } from "@app/api/db/schema";
import { summarizeItem } from "@app/api/lib/llm/__mocks__/index";
import { LLMError } from "@app/api/lib/llm/types";
import {
  getItemContent,
  uploadItemSummary,
} from "@app/api/lib/storage/__mocks__/index";
import { StorageError } from "@app/api/lib/storage/types";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_USER_ID,
  postRequest,
  setUpMockApp,
  streamResponseLines,
} from "@app/api/utils/test/api";
import { MOCK_ITEMS, MOCK_PROFILE_ITEMS } from "@app/api/utils/test/data";
import { testDb } from "@app/api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";

import { summaryRouter } from ".";

describe("POST /v1/premium/item/summary", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp(
      "v1/premium/item/summary",
      summaryRouter,
      DEFAULT_TEST_USER_ID,
    );
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
  });

  it("should return a summary for valid input (no existing summary)", async () => {
    const response: Response = await postRequest(
      app,
      "/v1/premium/item/summary",
      {
        slug: MOCK_ITEMS[0].slug,
        versionName: null,
      },
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.summary).toBe("This is the summary.");
    expect(uploadItemSummary).toHaveBeenCalledOnce();
    expect(uploadItemSummary.mock.calls[0][1]).toBe(MOCK_ITEMS[0].slug);
    expect(uploadItemSummary.mock.calls[0][2]).toBe(null);
    expect(uploadItemSummary.mock.calls[0][3]).toBe("This is the summary.");
  });

  it("should return a summary for valid input on custom version (no existing summary)", async () => {
    const response = await postRequest(app, "/v1/premium/item/summary", {
      slug: MOCK_ITEMS[0].slug,
      versionName: "2020-01-01",
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.summary).toBe("This is the summary.");
    expect(uploadItemSummary).toHaveBeenCalledOnce();
    expect(uploadItemSummary.mock.calls[0][1]).toBe(MOCK_ITEMS[0].slug);
    expect(uploadItemSummary.mock.calls[0][2]).toBe("2020-01-01");
    expect(uploadItemSummary.mock.calls[0][3]).toBe("This is the summary.");
  });

  it("should return an existing summary if present", async () => {
    getItemContent.mockResolvedValueOnce({
      content: "article text",
      summary: "Existing summary",
    });
    const response = await postRequest(app, "/v1/premium/item/summary", {
      slug: MOCK_ITEMS[0].slug,
      versionName: null,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.summary).toBe("Existing summary");
    expect(uploadItemSummary).not.toHaveBeenCalled();
  });

  it("should return 404 if item not found", async () => {
    getItemContent.mockRejectedValueOnce(new StorageError("Not found"));
    const response = await postRequest(app, "/v1/premium/item/summary", {
      slug: MOCK_ITEMS[0].slug,
      versionName: null,
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Failed to generate summary.");
  });

  it("should return 500 if LLM fails", async () => {
    summarizeItem.mockRejectedValueOnce(new LLMError("LLM failed"));
    const response = await postRequest(app, "/v1/premium/item/summary", {
      slug: MOCK_ITEMS[0].slug,
      versionName: null,
    });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to generate summary.");
  });

  it("should return 500 if upload fails", async () => {
    uploadItemSummary.mockRejectedValueOnce(new StorageError("Upload failed"));
    const response = await postRequest(app, "/v1/premium/item/summary", {
      slug: MOCK_ITEMS[0].slug,
      versionName: null,
    });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to generate summary.");
  });

  it("should stream summary with Accept: text/plain", async () => {
    const response = await postRequest(
      app,
      "/v1/premium/item/summary",
      {
        slug: MOCK_ITEMS[0].slug,
        versionName: null,
      },
      { Accept: "text/plain" },
    );
    expect(response.status).toBe(200);
    const expectedLines = [
      "This is the summary.",
      "Continued summary section.",
      "Final summary section.",
      "Done.",
    ];
    let i = 0;
    for await (const line of streamResponseLines(response)) {
      expect(line).toBe(expectedLines[i]);
      i++;
    }
    expect(i).toBe(expectedLines.length);

    expect(uploadItemSummary).toHaveBeenCalledWith(
      expect.anything(),
      MOCK_ITEMS[0].slug,
      null,
      "This is the summary.\nContinued summary section.\nFinal summary section.\nDone.",
    );
  });

  it("should stream summary with Accept: text/event-stream", async () => {
    const response = await postRequest(
      app,
      "/v1/premium/item/summary",
      {
        slug: MOCK_ITEMS[0].slug,
        versionName: null,
      },
      { Accept: "text/event-stream" },
    );
    expect(response.status).toBe(200);
    const expectedLines = [
      "This is the summary.",
      "Continued summary section.",
      "Final summary section.",
      "Done.",
    ];
    let i = 0;
    for await (const line of streamResponseLines(response)) {
      expect(line).toBe(expectedLines[i]);
      i++;
    }
    expect(i).toBe(expectedLines.length);

    expect(uploadItemSummary).toHaveBeenCalledWith(
      expect.anything(),
      MOCK_ITEMS[0].slug,
      null,
      "This is the summary.\nContinued summary section.\nFinal summary section.\nDone.",
    );
  });
});
