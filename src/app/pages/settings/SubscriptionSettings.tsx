import Button from "@app/components/ui/Button";
import { FormSection } from "@app/components/ui/Form";
import Spinner from "@app/components/ui/Spinner";
import { PREMIUM_FEATURES } from "@app/pages/docs/docs";
import { useSettings } from "@app/providers/Settings";
import { useToast } from "@app/providers/Toast";
import { useUser } from "@app/providers/User";
import { cn } from "@app/utils/cn";
import { createLogger } from "@app/utils/logger";
import {
  type CustomerInfoNative,
  type CustomerInfoWeb,
  getCustomerInfo,
  getPackages,
  initializePurchasing,
  purchasePackage,
  type UnifiedPackage,
} from "@app/utils/purchases";
import React, { useCallback, useEffect, useState } from "react";

const log = createLogger("SubscriptionSettings");

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
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
  }, [fetchPackages]);

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
        setPurchaseError(error.message);
        if (error.message) {
          showToast(error.message, {
            dismissable: true,
            disappearing: false,
            type: "error",
          });
        }
      } else {
        log.error("Failed to purchase subscription", error);
        setPurchaseError("Purchase failed.");
        showToast("Purchase failed.", {
          dismissable: true,
          disappearing: false,
          type: "error",
        });
      }
    } finally {
      setPurchaseLoading(null);
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

  // Helper to get expiration logic
  let willRenew = false;
  let expiresAt: string | number | Date | null = null;

  if (currentSubscription && customerInfo) {
    // Both SDKs have a similar structure for this map
    const ent =
      customerInfo.subscriptionsByProductIdentifier?.[currentSubscription];
    // OR customerInfo.allExpirationDates etc. but subscriptionsByProductIdentifier is most detailed usually.

    // Let's stick to subscription ID lookups if possible, but the types diverge.
    // Safest:
    if (ent) {
      willRenew = ent.willRenew;
      // @ts-expect-error - expirationDate property name divergence between web/native
      expiresAt = ent.expirationDate || ent.expiresDate;
    } else {
      const entitlement = customerInfo.entitlements?.active?.["premium"]; // Assuming 'premium' is entitlement ID? Or just check product ID.
      if (entitlement) {
        willRenew = entitlement.willRenew;
        // @ts-expect-error - expirationDate property name divergence
        expiresAt = entitlement.expirationDate || entitlement.expiresDate;
      }
    }
  }

  // Find the package that matches the current subscription ID
  // Note: on Web, the sub ID matches the stripe product ID.
  // On Native, it matches the store product ID.
  // Our UnifiedPackage has the product.identifier.
  const currentPackage = packageOptions.find(
    (p) => p.product.identifier === currentSubscription,
  );

  const currentPackageDescription = willRenew
    ? `${currentPackage?.product.priceString || "error"} billed every ${currentPackage?.product.billingPeriod || "error"}`
    : expiresAt
      ? `Expires ${new Date(expiresAt).toLocaleDateString()} at ${new Date(expiresAt).toLocaleTimeString()}`
      : currentSubscription;

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
          ) : activeSubs.size === 0 ? (
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
          ) : activeSubs.size >= 1 ? (
            <div className="grid grid-cols-1 gap-2">
              <Button
                href={customerInfo?.managementURL || ""}
                hrefNewTab
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
          {purchaseError && (
            <div className="text-danger mt-4">{purchaseError}</div>
          )}
        </div>
      </FormSection>
    </div>
  );
};

export default SubscriptionSettings;
