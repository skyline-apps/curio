import {
  handleRevenueCatEvent,
  SubscriptionError,
} from "@app/api/db/dal/subscriptions";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { type EnvBindings } from "@app/api/utils/env";
import {
  RevenueCatWebhookRequest,
  RevenueCatWebhookRequestSchema,
  RevenueCatWebhookResponse,
  RevenueCatWebhookResponseSchema,
} from "@app/schemas/v1/public/subscriptions/revenuecat";
import { Hono } from "hono";

export const revenuecatRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc(
      "post",
      RevenueCatWebhookRequestSchema,
      RevenueCatWebhookResponseSchema,
    ),
  ),
  zValidator(
    "json",
    RevenueCatWebhookRequestSchema,
    parseError<RevenueCatWebhookRequest, RevenueCatWebhookResponse>,
  ),
  async (c): Promise<APIResponse<RevenueCatWebhookResponse>> => {
    const log = c.get("log");
    const db = c.get("db");
    const appSecret = c.env.CURIO_APP_SECRET;
    const authHeader = c.req.header("Authorization");
    const requestSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;
    if (!appSecret || requestSecret !== appSecret) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { event } = c.req.valid("json");

    try {
      await db.transaction(async (tx) => {
        await handleRevenueCatEvent(event, tx, log);
      });

      const response = RevenueCatWebhookResponseSchema.parse({
        success: true,
      });
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof SubscriptionError) {
        log.error("RevenueCat subscription error", { error: error.message });
        const response = RevenueCatWebhookResponseSchema.parse({
          success: false,
          message: error.message,
        });
        return c.json(response, error.statusCode || 500);
      }

      log.error("Failed to process RevenueCat event", { error });
      const response = RevenueCatWebhookResponseSchema.parse({
        success: false,
        message: "Failed to process event",
      });
      return c.json(response, 500);
    }
  },
);
