import { and, eq } from "@app/api/db";
import { profiles, subscriptions } from "@app/api/db/schema";
import type { Logger } from "@app/api/utils/logger";
import type { ContentfulStatusCode } from "@app/api/utils/types";
import { SubscriptionStatus } from "@app/schemas/db";
import type { RevenueCatEvent } from "@app/schemas/v1/public/subscriptions/revenuecat";

import type { TransactionDB } from "..";

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: ContentfulStatusCode,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export async function handleRevenueCatEvent(
  event: RevenueCatEvent,
  tx: TransactionDB,
  log: Logger,
): Promise<void> {
  // Find the profile by app_user_id
  const profile = await tx.query.profiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.id, event.app_user_id),
  });

  if (!profile) {
    log.error("Profile not found for RevenueCat app user ID", {
      appUserId: event.app_user_id,
    });
    throw new SubscriptionError(`Profile not found for app user ID`);
  }

  // Handle different event types
  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL": {
      // Create or update subscription
      const subscriptionData = {
        profileId: profile.id,
        appUserId: event.app_user_id,
        productId: event.product_id || "unknown",
        originalTransactionId: event.original_transaction_id || null,
        status:
          event.period_type === "TRIAL"
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.ACTIVE,
        purchaseDate: new Date(event.purchased_at_ms || Date.now()),
        expirationDate: event.expiration_at_ms
          ? new Date(event.expiration_at_ms)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days if no expiration
        autoRenewStatus: event.is_trial_conversion || false, // Use is_trial_conversion as a proxy for auto-renewal
        updatedAt: new Date(),
      };

      await tx
        .insert(subscriptions)
        .values(subscriptionData)
        .onConflictDoUpdate({
          target: [subscriptions.profileId],
          set: {
            ...subscriptionData,
            updatedAt: new Date(),
          },
        });

      // Update the profile to mark as premium
      await tx
        .update(profiles)
        .set({
          isPremium: true,
          premiumExpiresAt: subscriptionData.expirationDate,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profile.id));
      break;
    }

    case "CANCELLATION":
      // Update subscription status to inactive
      await tx
        .update(subscriptions)
        .set({
          status: SubscriptionStatus.INACTIVE,
          autoRenewStatus: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.profileId, profile.id),
            eq(subscriptions.appUserId, event.app_user_id),
          ),
        );

      // Update the profile to mark as not premium
      await tx
        .update(profiles)
        .set({
          isPremium: false,
          premiumExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profile.id));
      break;

    case "EXPIRATION":
      // Update subscription status to expired
      await tx
        .update(subscriptions)
        .set({
          status: SubscriptionStatus.EXPIRED,
          autoRenewStatus: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.profileId, profile.id),
            eq(subscriptions.appUserId, event.app_user_id),
          ),
        );

      // Update the profile to mark as not premium
      await tx
        .update(profiles)
        .set({
          isPremium: false,
          premiumExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profile.id));
      break;

    case "UNCANCELLATION":
      // Reactivate subscription
      await tx
        .update(subscriptions)
        .set({
          status: SubscriptionStatus.ACTIVE,
          autoRenewStatus: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.profileId, profile.id),
            eq(subscriptions.appUserId, event.app_user_id),
          ),
        );
      break;

    case "NON_RENEWING_PURCHASE":
      // Handle non-renewing purchase (one-time purchase)
      const expirationDate = event.expiration_at_ms
        ? new Date(event.expiration_at_ms)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days if no expiration

      await tx
        .update(subscriptions)
        .set({
          status: SubscriptionStatus.ACTIVE,
          autoRenewStatus: false,
          expirationDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.profileId, profile.id),
            eq(subscriptions.appUserId, event.app_user_id),
          ),
        );

      // Update the profile to mark as premium until expiration
      await tx
        .update(profiles)
        .set({
          isPremium: true,
          premiumExpiresAt: expirationDate,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profile.id));
      break;

    case "SUBSCRIPTION_PAUSED":
      // Handle subscription paused
      await tx
        .update(subscriptions)
        .set({
          status: SubscriptionStatus.PAUSED,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.profileId, profile.id),
            eq(subscriptions.appUserId, event.app_user_id),
          ),
        );

      // Update the profile to mark as not premium while paused
      await tx
        .update(profiles)
        .set({
          isPremium: false,
          premiumExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profile.id));
      break;

    case "PRODUCT_CHANGE":
      // Handle product change (upgrade/downgrade)
      if (event.new_product_id) {
        await tx
          .update(subscriptions)
          .set({
            productId: event.new_product_id,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(subscriptions.profileId, profile.id),
              eq(subscriptions.appUserId, event.app_user_id),
            ),
          );
      }
      break;

    // Add more event types as needed
    default:
      log.info("Unhandled RevenueCat event type", { type: event.type });
  }
}
