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
  "SUBSCRIPTION_EXTENDED",
  "SUBSCRIPTION_EXTENSION",
  "SUBSCRIPTION_REVOKED",
  "TRANSFER",
]);

export type RevenueCatEventTypeEnum = z.infer<typeof RevenueCatEventType>;

export const RevenueCatPeriodType = z.enum(["NORMAL", "INTRO", "TRIAL"]);

export const RevenueCatStore = z.enum([
  "APP_STORE",
  "PLAY_STORE",
  "STRIPE",
  "MAC_APP_STORE",
  "PROMOTIONAL",
  "AMAZON",
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
  id: z.string(),
  type: RevenueCatEventType,
  app_user_id: z.string(),
  product_id: z.string().optional(),
  price_in_purchased_currency: z.number().optional(),
  currency: z.string().optional(),
  price: z.number().optional(),
  price_in_usd: z.number().optional(),
  takehome_percentage: z.number().optional(),
  commission_percentage: z.number().optional(),
  presented_offering_identifier: z.string().optional(),
  presented_offering_id: z.string().optional(),
  presented_offering_context: z.record(z.unknown()).optional(),
  store: RevenueCatStore.optional(),
  environment: RevenueCatEnvironment.optional(),
  period_type: RevenueCatPeriodType.optional(),
  purchased_at_ms: z.number().optional(),
  expiration_at_ms: z.number().optional(),
  auto_resume_at_ms: z.number().optional().nullable(),
  is_trial_conversion: z.boolean().optional(),
  auto_renew_status: z
    .union([
      z.literal("will_renew"),
      z.literal("will_not_renew"),
      z.literal("will_change_product"),
      z.literal("will_pause"),
      z.literal("requires_price_increase_consent"),
      z.literal("has_already_renewed"),
    ])
    .optional(),
  subscriber_attributes: RevenueCatSubscriberAttributesSchema.optional(),
  entitlement_ids: z.array(z.string()).optional(),
  transaction_id: z.string().optional(),
  original_transaction_id: z.string().optional(),
  is_upgraded_offer: z.boolean().optional(),
  offer_code: z.string().optional(),
  offer_identifier: z.string().optional(),
  offer_type: z.number().optional(),
  payment_mode: z.string().optional(),
  cancel_reason: z.string().optional(),
  price_in_purchased_currency_in_usd: z.number().optional(),
  original_price_in_purchased_currency: z.number().optional(),
  original_price_in_purchased_currency_in_usd: z.number().optional(),
  store_transaction_id: z.string().optional(),
  subscriber_attributes_updated: z.boolean().optional(),
  new_product_id: z.string().optional(),
  expiration_reason: z.string().optional(),
  grace_period_expiration_date: z.string().optional(),
  is_in_billing_retry_period: z.boolean().optional(),
  offer_discount_type: z.string().optional(),
  entitlement_id: z.string().optional(),
  entitlement_ids_added: z.array(z.string()).optional(),
  entitlement_ids_revoked: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
  original_app_user_id: z.string().optional(),
  event_timestamp_ms: z.number(),
});

export type RevenueCatEvent = z.infer<typeof RevenueCatEventSchema>;

export const RevenueCatWebhookRequestSchema = z.object({
  event: RevenueCatEventSchema,
  api_version: z.string(),
  event_timestamp_ms: z.number(),
  environment: RevenueCatEnvironment,
  user_id: z.string(),
  app_id: z.string(),
  app_user_id: z.string(),
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
