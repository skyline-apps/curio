import Button from "@app/components/ui/Button";
import { FormSection } from "@app/components/ui/Form";
import Spinner from "@app/components/ui/Spinner";
import { useSettings } from "@app/providers/Settings";
import { useToast } from "@app/providers/Toast";
import { useUser } from "@app/providers/User";
import { cn } from "@app/utils/cn";
import { PREMIUM_FEATURES } from "@app/utils/content/docs";
import { createLogger } from "@app/utils/logger";
import { isNativePlatform } from "@app/utils/platform";
import {
  type CustomerInfoNative,
  type CustomerInfoWeb,
  EntitlementInfo,
  getCustomerInfo,
  getPackages,
  initializePurchasing,
  purchasePackage,
  restorePurchases,
  Store,
  type UnifiedPackage,
} from "@app/utils/purchases";
import React, { useCallback, useEffect, useState } from "react";

const log = createLogger("SubscriptionSettings");

// Helper to determine the best entitlement to display
const getBestEntitlement = (
  customerInfo: CustomerInfoNative | CustomerInfoWeb | null,
): EntitlementInfo | undefined => {
  log.info("CUSTOMER INFO", JSON.stringify(customerInfo, null, 2));
  if (!customerInfo?.entitlements) return undefined;

  // We look at all entitlements to find the most relevant one
  const all = Object.values(customerInfo.entitlements.all || {});
  const candidates = [...all];

  if (candidates.length === 0) return undefined;

  // Sort candidates to find the "best" one:
  // 1. Active/Renewing
  // 2. Active (isActive)
  // 3. Latest expiration
  return candidates.sort((a, b) => {
    if (a.willRenew && !b.willRenew) return -1;
    if (!a.willRenew && b.willRenew) return 1;

    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;

    const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
    const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
    return dateB - dateA;
  })[0];
};

const getEntitlementSource = (store: Store | undefined): string => {
  switch (store?.toLowerCase()) {
    case "app_store":
    case "mac_app_store":
      return "the App Store";
    case "play_store":
      return "Google Play";
    case "stripe":
    case "promotional":
      return "Web";
    default:
      return "another platform";
  }
};

interface PackageOptionProps {
  rcPackage: UnifiedPackage;
  handlePurchase: (rcPackage: UnifiedPackage) => Promise<void>;
  purchaseLoading: string | null;
}

const PackageOption: React.FC<PackageOptionProps> = ({
  rcPackage,
  handlePurchase,
  purchaseLoading,
}) => {
  const { title, priceString, billingPeriod } = rcPackage.product;
  const billingDescription = `${priceString} / ${billingPeriod}`;
  const isYearly = billingPeriod === "year" || billingPeriod === "yr";

  return (
    <Button
      onPress={() => handlePurchase(rcPackage)}
      color="success"
      variant={isYearly ? "shadow" : "flat"}
      isDisabled={!!purchaseLoading}
      isLoading={purchaseLoading === rcPackage.identifier}
      endContent={billingDescription}
    >
      <div className="flex flex-col">
        {title}
        <p
          className={cn(
            "text-xs",
            isYearly ? "text-success-100" : "text-success-600",
          )}
        >
          {billingDescription}
        </p>
      </div>
    </Button>
  );
};

const SubscriptionSettings: React.FC = () => {
  const { user } = useUser();
  const { isPremium, refreshProfile } = useSettings();
  const [packageOptions, setPackageOptions] = useState<UnifiedPackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<
    CustomerInfoNative | CustomerInfoWeb | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const { showToast } = useToast();

  const fetchPackages = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    if (!user.id) {
      setTimeout(() => fetchPackages(), 100);
      return;
    }
    try {
      initializePurchasing(user.id);
      const customerInfo = await getCustomerInfo();
      setCustomerInfo(customerInfo);
      const currentPackages = await getPackages();
      setPackageOptions(currentPackages);
    } catch (error) {
      log.error("Failed to load subscription packages", error);
      setError("Failed to load subscription packages.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchPackages();
    refreshProfile();
  }, [fetchPackages, refreshProfile]);

  async function handlePurchase(rcPackage: UnifiedPackage): Promise<void> {
    setPurchaseLoading(rcPackage.identifier);
    setPurchaseError(null);
    if (!user.email) {
      log.error("User email is missing");
      setError("User email is missing.");
      return;
    }
    try {
      await purchasePackage(rcPackage, user.email);
      setTimeout(() => fetchPackages(), 100);
      setTimeout(() => refreshProfile(), 1000);
      showToast(
        "Thank you for your purchase! It may take a few moments to update your access to Premium features.",
        {
          dismissable: true,
          disappearing: false,
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        log.error("Failed to purchase subscription", error);
        setPurchaseError(`Failed to purchase subscription: ${error.message}`);
        if (error.message) {
          showToast("Failed to purchase subscription", {
            dismissable: true,
            disappearing: false,
            type: "error",
          });
        }
      } else {
        log.error("Subscription purchase failed", error);
        setPurchaseError("Subscription purchase failed.");
        showToast("Subscription purchase failed.", {
          dismissable: true,
          disappearing: false,
          type: "error",
        });
      }
    } finally {
      setPurchaseLoading(null);
    }
  }

  async function handleRestore(): Promise<void> {
    setIsRestoring(true);
    try {
      await restorePurchases();
      setTimeout(() => fetchPackages(), 100);
      setTimeout(() => refreshProfile(), 1000);
      showToast("Purchases restored successfully.", {
        dismissable: true,
        disappearing: true,
      });
    } catch (error) {
      log.error("Failed to restore purchases", error);
      showToast("Failed to restore purchases.", {
        dismissable: true,
        disappearing: false,
        type: "error",
      });
    } finally {
      setIsRestoring(false);
    }
  }

  // Helper to get active subs safely from either Web or Native object
  const getActiveSubscriptions = (): Set<string> => {
    if (!customerInfo) return new Set<string>();
    // Check if it's the Native object (has activeSubscriptions as array of strings in some versions, or Set)
    // The capacitor plugin types usually say activeSubscriptions is string[] but purchases-js says Set<string>.
    // Let's check safely.
    if (Array.isArray(customerInfo.activeSubscriptions)) {
      return new Set(customerInfo.activeSubscriptions);
    }
    return customerInfo.activeSubscriptions as Set<string>;
  };

  const activeSubs = getActiveSubscriptions();
  const currentSubscription = activeSubs.values().next().value;

  // Find best entitlement to display
  const entitlement = getBestEntitlement(customerInfo);

  // Consider entitlement active if it's explicitly active OR renewing OR (valid check) expiring in future
  const isEntitlementActive =
    !!entitlement &&
    (entitlement.isActive ||
      entitlement.willRenew ||
      (entitlement.expirationDate &&
        new Date(entitlement.expirationDate) > new Date()));

  let willRenew = false;
  let expiresAt: string | number | Date | null = null;

  if (entitlement) {
    willRenew = entitlement.willRenew;
    expiresAt = entitlement.expirationDate || null;
  }

  // Find the package that matches the current subscription ID
  const currentPackage = packageOptions.find(
    (p) => p.product.identifier === currentSubscription,
  );

  let currentPackageDescription = "";

  if (currentPackage && isEntitlementActive) {
    // Normal case: active subscription for known package
    currentPackageDescription = willRenew
      ? `${currentPackage.product.priceString} billed every ${currentPackage.product.billingPeriod}`
      : expiresAt
        ? `Expires ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}`
        : `${currentPackage.product.priceString} billed every ${currentPackage.product.billingPeriod}`;
  } else if (isPremium && !isEntitlementActive) {
    // Ghost State: Premium in DB, but no active entitlement locally
    // This happens when subscription is managed on another platform and not fully synced or expired locally but grace period/server logic allows access
    currentPackageDescription = "Subscription active";
  } else {
    // Fallback: Entitlement exists (possibly expired) or cross-platform
    const platformSource = getEntitlementSource(entitlement?.store);
    const fallbackText = `Subscription purchased via ${platformSource}`;

    currentPackageDescription = expiresAt
      ? `Expires ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}`
      : fallbackText;
  }

  const handleManage = (): void => {
    if (customerInfo?.managementURL) {
      window.open(customerInfo.managementURL, "_blank");
      return;
    }

    // Ghost State handling
    if (isPremium && !isEntitlementActive) {
      showToast(
        "Please manage your subscription on the platform you purchased it on.",
        { dismissable: true },
      );
      return;
    }

    const store = entitlement?.store?.toLowerCase();
    if (store === "app_store" || store === "mac_app_store") {
      showToast("Please manage your subscription in your Apple ID settings.", {
        dismissable: true,
      });
    } else if (store === "play_store") {
      showToast("Please manage your subscription in the Google Play Store.", {
        dismissable: true,
      });
    } else {
      showToast(
        "Please manage your subscription on the platform you purchased it on.",
        { dismissable: true },
      );
    }
  };

  return (
    <div className="space-y-4">
      <FormSection title="Curio Premium">
        <div className="flex flex-col gap-2 w-full max-w-96">
          <p className="text-xs text-secondary">
            {isPremium
              ? "Thank you for being a paid Curio supporter! Your subscription goes towards supporting our hosting costs."
              : currentSubscription
                ? "Please wait a few moments while your subscription status is updated to use Premium features."
                : "Curio will always remain free to use. However, to support our hosting costs, please consider becoming a paid supporter."}
          </p>
          <p className="text-xs text-secondary">
            Paid supporters get access to the following:
          </p>
          <ul className="list-disc list-inside text-xs text-secondary">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          {loading ? (
            <Spinner centered />
          ) : error ? (
            <div className="text-danger text-sm">{error}</div>
          ) : !isPremium && activeSubs.size === 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {packageOptions.length === 0 && (
                <div className="text-sm text-danger">
                  No subscription plans available.
                </div>
              )}
              {packageOptions.map((packageOption) => (
                <PackageOption
                  key={packageOption.identifier}
                  rcPackage={packageOption}
                  handlePurchase={handlePurchase}
                  purchaseLoading={purchaseLoading}
                />
              ))}
            </div>
          ) : isPremium || activeSubs.size >= 1 ? (
            <div className="grid grid-cols-1 gap-2">
              <Button
                onPress={handleManage}
                color="primary"
                isDisabled={!!purchaseLoading}
                isLoading={purchaseLoading === ""}
              >
                <div className="flex flex-col">
                  Manage subscription
                  <p className="text-xs text-primary-100">
                    {currentPackageDescription}
                  </p>
                </div>
              </Button>
            </div>
          ) : (
            <div className="text-danger mt-4">
              You seem to have an issue with your subscriptions. Please contact{" "}
              <a href="mailto:support@curi.ooo">support@curi.ooo</a> for
              assistance.
            </div>
          )}
          {isNativePlatform() && (
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onPress={handleRestore}
                isLoading={isRestoring}
                isDisabled={!!purchaseLoading || loading}
              >
                Restore purchases
              </Button>
            </div>
          )}
          {purchaseError && (
            <div className="text-danger mt-4">{purchaseError}</div>
          )}
        </div>
      </FormSection>
    </div>
  );
};

export default SubscriptionSettings;
