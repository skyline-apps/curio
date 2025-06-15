import { items, profileItems } from "@app/api/db/schema";
import { explainInContext } from "@app/api/lib/llm/__mocks__";
import { LLMError } from "@app/api/lib/llm/types";
import { getItemContent } from "@app/api/lib/storage/__mocks__/";
import { StorageError } from "@app/api/lib/storage/types";
import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_USER_ID,
  postRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { MOCK_ITEMS, MOCK_PROFILE_ITEMS } from "@app/api/utils/test/data";
import { testDb } from "@app/api/utils/test/provider";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";

import { contextRouter } from ".";

describe("POST /v1/premium/item/context", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp(
      "v1/premium/item/context",
      contextRouter,
      DEFAULT_TEST_USER_ID,
    );
    await testDb.db.insert(items).values(MOCK_ITEMS);
    await testDb.db.insert(profileItems).values(MOCK_PROFILE_ITEMS);
  });

  it("should return an explanation for valid input", async () => {
    const response = await postRequest(app, "/v1/premium/item/context", {
      slug: MOCK_ITEMS[0].slug,
      snippet: "test snippet",
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.explanation).toBe("This is the explanation.");
  });

  it("should return 404 if item not found", async () => {
    getItemContent.mockRejectedValueOnce(new StorageError("Not found"));
    const response = await postRequest(app, "/v1/premium/item/context", {
      slug: MOCK_ITEMS[0].slug,
      snippet: "test snippet",
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Failed to generate context.");
  });

  it("should return 500 if LLM fails", async () => {
    explainInContext.mockRejectedValueOnce(new LLMError("LLM failed"));
    const response = await postRequest(app, "/v1/premium/item/context", {
      slug: MOCK_ITEMS[0].slug,
      snippet: "test snippet",
    });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to generate context.");
  });
});
