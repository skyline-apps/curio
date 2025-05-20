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
    const req = c.req;
    const revenuecatWebhookSecret = c.env.REVENUECAT_WEBHOOK_SECRET;
    const signature = req.header("revenuecat-signature");

    // Verify webhook signature if secret is configured
    if (revenuecatWebhookSecret) {
      if (!signature) {
        log.warn("Missing RevenueCat signature header");
        return c.json({ success: false, message: "Missing signature" }, 401);
      }

      const payload = await req.text();
      const isValid = await verifyWebhookSignature(
        payload,
        signature,
        revenuecatWebhookSecret,
      );

      if (!isValid) {
        log.warn("Invalid RevenueCat webhook signature");
        const response = RevenueCatWebhookResponseSchema.parse({
          success: false,
          message: "Invalid signature",
        });
        return c.json(response, 401);
      }
    } else {
      log.error("RevenueCat webhook secret not configured");
      const response = RevenueCatWebhookResponseSchema.parse({
        success: false,
        message: "RevenueCat webhook secret not configured",
      });
      return c.json(response, 500);
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

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    // The signature is in the format: t=timestamp,v1=signature
    const [timestamp, signatureValue] = signature.split(",");
    const [timestampPrefix, timestampValue] = timestamp.split("=", 2);
    const [signaturePrefix, signatureHash] = signatureValue.split("=", 2);

    if (timestampPrefix !== "t" || signaturePrefix !== "v1" || !signatureHash) {
      return false;
    }

    // Verify the timestamp is recent (e.g., within 5 minutes)
    const timestampMs = parseInt(timestampValue, 10) * 1000;
    const now = Date.now();
    if (isNaN(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      return false;
    }

    // Import the key
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // The signed data is in the format: t=timestamp.payload
    const data = `${timestamp}.${payload}`;
    const signatureBytes = hexToBytes(signatureHash);
    const dataBytes = encoder.encode(data);

    return await crypto.subtle.verify("HMAC", key, signatureBytes, dataBytes);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
