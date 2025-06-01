import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import type { Logger } from "@app/api/utils/logger";
import type { ContentfulStatusCode } from "@app/api/utils/types";
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
  const profileResults = await tx
    .select()
    .from(profiles)
    .where(eq(profiles.userId, event.app_user_id))
    .limit(1);

  if (!profileResults?.length) {
    log.error("Profile not found for RevenueCat app user ID", {
      appUserId: event.app_user_id,
    });
    throw new SubscriptionError(`Profile not found for app user ID`);
  }
  const profile = profileResults[0];

  if (!event.expiration_at_ms) {
    log.error("Expiration date not found for RevenueCat event", {
      appUserId: event.app_user_id,
    });
    throw new SubscriptionError(`Expiration date not found for app user ID`);
  }

  // Handle different event types
  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE": {
      const expirationDate = new Date(event.expiration_at_ms);
      await tx
        .update(profiles)
        .set({
          isPremium: true,
          premiumExpiresAt: expirationDate,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profile.id));
      break;
    }

    case "CANCELLATION":
      // Do nothing, since the user stays premium until their subscription expires.
      break;

    case "EXPIRATION":
      // Update profile to mark as not premium
      await tx
        .update(profiles)
        .set({
          isPremium: false,
          premiumExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profile.id));
      break;

    case "SUBSCRIPTION_PAUSED":
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

    default:
      log.info("Unhandled RevenueCat event type", { type: event.type });
  }
}
