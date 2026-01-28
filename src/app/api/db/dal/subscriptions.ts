import { eq } from "@app/api/db";
import { authUsers, profiles } from "@app/api/db/schema";
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
  sandboxEmails?: string[],
): Promise<void> {
  // Filter SANDBOX events
  if (event.environment === "SANDBOX") {
    const appUserId = event.app_user_id;

    if (!appUserId) {
      log.warn("Sandbox event missing user identification, ignoring", {
        event,
      });
      return;
    }

    const userResults = await tx
      .select({ email: authUsers.email })
      .from(authUsers)
      .where(eq(authUsers.id, appUserId))
      .limit(1);

    const userEmail = userResults[0]?.email;

    if (userEmail && !sandboxEmails?.includes(userEmail)) {
      log.info("Ignoring sandbox event", {
        appUserId,
        email: userEmail,
      });
      return;
    }
    log.info("Processing sandbox event for demo user", {
      appUserId,
    });
  }

  if (event.type === "TRANSFER") {
    log.info("Handling RevenueCat TRANSFER event", {
      transferredFrom: event.transferred_from,
      transferredTo: event.transferred_to,
    });

    if (
      !event.transferred_from ||
      event.transferred_from.length === 0 ||
      !event.transferred_to ||
      event.transferred_to.length === 0
    ) {
      log.warn("Transfer event missing from/to users", { event });
      return;
    }

    const fromUserId = event.transferred_from[0];
    const toUserId = event.transferred_to[0];

    // Find the 'from' user to get their subscription status
    const fromProfileResults = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.userId, fromUserId))
      .limit(1);

    if (fromProfileResults.length > 0) {
      const fromProfile = fromProfileResults[0];

      if (fromProfile.isPremium && fromProfile.premiumExpiresAt) {
        log.info("Transferring subscription", {
          from: fromUserId,
          to: toUserId,
          expiresAt: fromProfile.premiumExpiresAt,
        });

        // Grant to 'to' user
        // Note: This assumes the 'to' user exists. correctly we should check or upsert?
        // But usually the user exists if they triggered a transfer (e.g. by logging in).
        await tx
          .update(profiles)
          .set({
            isPremium: true,
            premiumExpiresAt: fromProfile.premiumExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, toUserId));

        // Revoke from 'from' user
        await tx
          .update(profiles)
          .set({
            isPremium: false,
            premiumExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, fromUserId));
      } else {
        log.info("From user is not premium, skipping transfer", {
          fromUserId,
        });
      }
    } else {
      log.warn("From user profile not found during transfer", { fromUserId });
    }

    return;
  }

  // Find the profile by app_user_id
  if (!event.app_user_id) {
    log.error("Missing app_user_id for non-TRANSFER event", {
      type: event.type,
    });
    throw new SubscriptionError("Missing app_user_id", 400);
  }

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
