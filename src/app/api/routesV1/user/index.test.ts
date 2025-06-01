import { EnvBindings } from "@app/api/utils/env";
import {
  DEFAULT_TEST_USER_ID_2,
  DEFAULT_TEST_USERNAME,
  DEFAULT_TEST_USERNAME_2,
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
        isPremium: true,
        premiumExpiresAt: expect.any(String),
        upgradeBannerLastShownAt: expect.any(String),
      });
    });

    it("should return 200 with user profile for non-premium user", async () => {
      app = setUpMockApp("/v1/user", userRouter, DEFAULT_TEST_USER_ID_2);
      const response = await getRequest(app, "v1/user");
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        username: DEFAULT_TEST_USERNAME_2,
        newsletterEmail: null,
        isPremium: false,
        premiumExpiresAt: null,
        upgradeBannerLastShownAt: expect.any(String),
      });
    });
  });
});
