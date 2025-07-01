import { z } from "zod";

export const RevenueCatEventType = z.enum([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "CANCELLATION",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "SUBSCRIPTION_PAUSED",
  "EXPIRATION",
  "BILLING_ISSUE",
  "PRODUCT_CHANGE",
  "TRANSFER",
  "SUBSCRIPTION_EXTENDED",
  "REFUND_REVERSED",
]);

export type RevenueCatEventTypeEnum = z.infer<typeof RevenueCatEventType>;

export const RevenueCatPeriodType = z.enum([
  "NORMAL",
  "INTRO",
  "TRIAL",
  "PROMOTIONAL",
  "PREPAID",
]);

export const RevenueCatStore = z.enum([
  "APP_STORE",
  "PLAY_STORE",
  "STRIPE",
  "RC_BILLING",
]);

export const RevenueCatEnvironment = z.enum(["SANDBOX", "PRODUCTION"]);

export const RevenueCatSubscriberAttributesSchema = z.record(
  z.object({
    value: z.string(),
    updated_at_ms: z.number(),
  }),
);

export const RevenueCatEventSchema = z.object({
  app_id: z.string(),
  app_user_id: z.string(),
  type: RevenueCatEventType,
  id: z.string(),
  event_timestamp_ms: z.number(),
  original_app_user_id: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  subscriber_attributes: RevenueCatSubscriberAttributesSchema.optional(),

  product_id: z.string().optional(),
  entitlement_ids: z.array(z.string()).optional(),
  period_type: RevenueCatPeriodType.optional(),
  purchased_at_ms: z.number().optional(),
  grace_period_expiration_at_ms: z.number().optional(),
  expiration_at_ms: z.number().optional(),
  auto_resume_at_ms: z.number().optional().nullable(),
  store: RevenueCatStore.optional(),
  environment: RevenueCatEnvironment.optional(),
  is_trial_conversion: z.boolean().optional(),
  cancel_reason: z.string().optional(),
  expiration_reason: z.string().optional(),
  new_product_id: z.string().optional(),
  presented_offering_id: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  price_in_purchased_currency: z.number().optional(),
  tax_percentage: z.number().optional(),
  commission_percentage: z.number().optional().nullable(),
  transaction_id: z.string().optional(),
  original_transaction_id: z.string().optional(),
  transferred_from: z.array(z.string()).optional(),
  transferred_to: z.array(z.string()).optional(),
  country_code: z.string().optional(),
  offer_code: z.string().optional().nullable(),
  renewal_number: z.number().optional(),
});

export type RevenueCatEvent = z.infer<typeof RevenueCatEventSchema>;

export const RevenueCatWebhookRequestSchema = z.object({
  event: RevenueCatEventSchema,
  api_version: z.string(),
});

export type RevenueCatWebhookRequest = z.infer<
  typeof RevenueCatWebhookRequestSchema
>;

export const RevenueCatWebhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type RevenueCatWebhookResponse = z.infer<
  typeof RevenueCatWebhookResponseSchema
>;
