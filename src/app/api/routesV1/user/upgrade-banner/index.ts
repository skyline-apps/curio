import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import { apiDoc, APIResponse, describeRoute } from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  UpgradeBannerResponse,
  UpgradeBannerResponseSchema,
} from "@app/schemas/v1/user/upgrade-banner";
import { Hono } from "hono";

// eslint-disable-next-line @local/eslint-local-rules/api-validation
export const userUpgradeBannerRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(apiDoc("post", null, UpgradeBannerResponseSchema)),
  async (c): Promise<APIResponse<UpgradeBannerResponse>> => {
    const log = c.get("log");
    const profileId = c.get("profileId")!;
    const db = c.get("db");
    try {
      await db
        .update(profiles)
        .set({ upgradeBannerLastShownAt: new Date() })
        .where(eq(profiles.id, profileId));
      const response = UpgradeBannerResponseSchema.parse({ success: true });
      return c.json(response);
    } catch (e) {
      log.error("Failed to update upgrade banner", { error: e, profileId });
      return c.json({ success: false }, 500);
    }
  },
);
