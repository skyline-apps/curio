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
  UnsubscribeRequest,
  UnsubscribeRequestSchema,
  UnsubscribeResponse,
  UnsubscribeResponseSchema,
} from "@app/schemas/v1/public/user/unsubscribe";
import { Hono } from "hono";

export const publicUnsubscribeRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", UnsubscribeRequestSchema, UnsubscribeResponseSchema),
  ),
  zValidator(
    "json",
    UnsubscribeRequestSchema,
    parseError<UnsubscribeRequest, UnsubscribeResponse>,
  ),
  async (c): Promise<APIResponse<UnsubscribeResponse>> => {
    const log = c.get("log");
    const { profileId } = c.req.valid("json");
    try {
      const db = c.get("db");

      const updateResult = await db
        .update(profiles)
        .set({ marketingEmails: false })
        .where(eq(profiles.id, profileId))
        .returning();

      if (updateResult.length === 0) {
        return c.json({ error: "Profile not found" }, 404);
      }

      const response: UnsubscribeResponse = UnsubscribeResponseSchema.parse({
        success: true,
        message:
          "You have been successfully unsubscribed from marketing emails.",
      });

      return c.json(response);
    } catch (error) {
      log.error(`Error unsubscribing profile`, { profileId, error });
      return c.json({ error: "Error unsubscribing." }, 500);
    }
  },
);
