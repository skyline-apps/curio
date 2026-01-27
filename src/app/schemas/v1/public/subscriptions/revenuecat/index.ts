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
  "INVOICE_ISSUANCE",
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
  app_user_id: z.string().optional().nullable(),
  type: RevenueCatEventType,
  id: z.string(),
  event_timestamp_ms: z.number(),
  original_app_user_id: z.string().optional().nullable(),
  aliases: z.array(z.string()).optional().nullable(),
  subscriber_attributes:
    RevenueCatSubscriberAttributesSchema.optional().nullable(),

  product_id: z.string().optional().nullable(),
  entitlement_ids: z.array(z.string()).optional().nullable(),
  period_type: RevenueCatPeriodType.optional().nullable(),
  purchased_at_ms: z.number().optional().nullable(),
  grace_period_expiration_at_ms: z.number().optional().nullable(),
  expiration_at_ms: z.number().optional().nullable(),
  auto_resume_at_ms: z.number().optional().nullable(),
  store: RevenueCatStore.optional().nullable(),
  environment: RevenueCatEnvironment.optional().nullable(),
  is_trial_conversion: z.boolean().optional().nullable(),
  cancel_reason: z.string().optional().nullable(),
  expiration_reason: z.string().optional().nullable(),
  new_product_id: z.string().optional().nullable(),
  presented_offering_id: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  price_in_purchased_currency: z.number().optional().nullable(),
  tax_percentage: z.number().optional().nullable(),
  commission_percentage: z.number().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
  original_transaction_id: z.string().optional().nullable(),
  transferred_from: z.array(z.string()).optional().nullable(),
  transferred_to: z.array(z.string()).optional().nullable(),
  country_code: z.string().optional().nullable(),
  offer_code: z.string().optional().nullable(),
  renewal_number: z.number().optional().nullable(),
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
