import { eq, inArray } from "@app/api/db";
import { authUsers, profiles } from "@app/api/db/schema";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  SNSWebhookRequest,
  SNSWebhookRequestSchema,
  SNSWebhookResponse,
  SNSWebhookResponseSchema,
} from "@app/schemas/v1/public/webhooks/email";
import { Hono } from "hono";

export const publicWebhooksEmailRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", SNSWebhookRequestSchema, SNSWebhookResponseSchema),
  ),
  zValidator(
    "json",
    SNSWebhookRequestSchema,
    parseError<SNSWebhookRequest, SNSWebhookResponse>,
  ),
  async (c): Promise<APIResponse<SNSWebhookResponse>> => {
    const log = c.get("log");
    const db = c.get("db");

    const body = c.req.valid("json");

    log.info("Received webhook", { type: body.Type });

    if (body.Type === "SubscriptionConfirmation" && body.SubscribeURL) {
      log.info("Confirming SNS subscription", { url: body.SubscribeURL });
      await fetch(body.SubscribeURL);
      return c.json(SNSWebhookResponseSchema.parse({ success: true }));
    }

    if (body.Type === "Notification") {
      let message;
      try {
        message = JSON.parse(body.Message);
      } catch (e) {
        log.error("Failed to parse SNS message body", {
          error: e,
          message: body.Message,
        });
        return c.json(
          SNSWebhookResponseSchema.parse({
            success: false,
            error: "Invalid SNS Message",
          }),
          400,
        );
      }

      if (message.notificationType === "Bounce") {
        const bouncedRecipients = message.bounce?.bouncedRecipients || [];
        for (const recipient of bouncedRecipients) {
          const email = recipient.emailAddress;
          log.info("Processing bounce", { email });

          await db
            .update(profiles)
            .set({ emailBounced: true })
            .where(
              inArray(
                profiles.userId,
                db
                  .select({ id: authUsers.id })
                  .from(authUsers)
                  .where(eq(authUsers.email, email)),
              ),
            );
        }
      }
    }

    return c.json(SNSWebhookResponseSchema.parse({ success: true }));
  },
);
