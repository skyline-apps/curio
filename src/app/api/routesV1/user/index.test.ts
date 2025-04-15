import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_USERNAME,
  getRequest,
  setUpMockApp,
} from "@app/api/utils/test/api";
import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";

import { userRouter } from "./index";

describe("/v1/user", () => {
  let app: Hono<EnvBindings>;
  beforeAll(async () => {
    app = setUpMockApp("/v1/user", userRouter);
  });

  describe("GET /v1/user", () => {
    it("should return 200 with user profile", async () => {
      const response = await getRequest(app, "v1/user");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        username: DEFAULT_TEST_USERNAME,
        newsletterEmail: "test@testmail.curi.ooo",
      });
    });
  });
});
