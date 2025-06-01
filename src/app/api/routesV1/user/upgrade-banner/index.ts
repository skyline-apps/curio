import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  UpgradeBannerRequest,
  UpgradeBannerRequestSchema,
  UpgradeBannerResponse,
  UpgradeBannerResponseSchema,
} from "@app/schemas/v1/user/upgrade-banner";
import { Hono } from "hono";

export const userUpgradeBannerRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", UpgradeBannerRequestSchema, UpgradeBannerResponseSchema),
  ),
  zValidator(
    "json",
    UpgradeBannerRequestSchema,
    parseError<UpgradeBannerRequest, UpgradeBannerResponse>,
  ),
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
