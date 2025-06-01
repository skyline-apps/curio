import Button from "@app/components/ui/Button";
import { FormSection } from "@app/components/ui/Form";
import Spinner from "@app/components/ui/Spinner";
import { useSettings } from "@app/providers/Settings";
import { useUser } from "@app/providers/User";
import { createLogger } from "@app/utils/logger";
import {
  getPackages,
  initializePurchasing,
  type Package,
  purchasePackage,
} from "@app/utils/purchases";
import React, { useEffect, useState } from "react";

const log = createLogger("SubscriptionSettings");

interface PackageOptionProps {
  rcPackage: Package;
  handlePurchase: (rcPackage: Package) => Promise<void>;
  purchaseLoading: string | null;
}

const PackageOption: React.FC<PackageOptionProps> = ({
  rcPackage,
  handlePurchase,
  purchaseLoading,
}) => {
  const subscriptionOption =
    rcPackage.webBillingProduct.defaultSubscriptionOption?.base;
  const billingDescription = `${subscriptionOption?.price?.formattedPrice || "error"} / ${subscriptionOption?.period?.unit || "error"}`;
  return (
    <Button
      onPress={() => handlePurchase(rcPackage)}
      color="success"
      isDisabled={!!purchaseLoading}
      isLoading={purchaseLoading === rcPackage.identifier}
      endContent={billingDescription}
    >
      <div className="flex flex-col">
        {rcPackage.webBillingProduct.title}
        <p className="text-xs text-secondary-50">{billingDescription}</p>
      </div>
    </Button>
  );
};

const SubscriptionSettings: React.FC = () => {
  const { user } = useUser();
  const { isPremium } = useSettings();
  const [packageOptions, setPackageOptions] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackages(): Promise<void> {
      setLoading(true);
      setError(null);
      if (!user.id) {
        setTimeout(() => fetchPackages(), 100);
        return;
      }
      try {
        initializePurchasing(user.id);
        const currentPackages = await getPackages();
        if (currentPackages) {
          setPackageOptions(currentPackages);
        } else {
          setPackageOptions([]);
        }
      } catch (error) {
        log.error("Failed to load subscription packages", error);
        setError("Failed to load subscription packages.");
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, [user.id]);

  async function handlePurchase(rcPackage: Package): Promise<void> {
    setPurchaseLoading(rcPackage.identifier);
    setPurchaseError(null);
    if (!user.email) {
      log.error("User email is missing");
      setError("User email is missing.");
      return;
    }
    try {
      await purchasePackage(rcPackage, user.email);
    } catch (error) {
      if (error instanceof Error) {
        log.error("Failed to purchase subscription", error);
        setPurchaseError(error.message);
      } else {
        log.error("Failed to purchase subscription", error);
        setPurchaseError("Purchase failed.");
      }
    } finally {
      setPurchaseLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <FormSection title="Curio Premium">
        <div className="flex flex-col gap-2 w-full max-w-96">
          <p className="text-xs text-secondary">
            {isPremium
              ? "Thank you for being a paid Curio supporter! Your subscription goes towards supporting our hosting costs."
              : "Curio will always remain free to use. However, to support our hosting costs, please consider becoming a paid supporter."}
          </p>
          <p className="text-xs text-secondary">
            Paid supporters get access to the following:
          </p>
          <ul className="list-disc list-inside text-xs text-secondary">
            <li>AI-powered article summaries</li>
            <li>In-context snippet explanations</li>
            <li>And more to come!</li>
          </ul>
          {loading ? (
            <Spinner centered />
          ) : error ? (
            <div className="text-danger text-sm">{error}</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {packageOptions.length === 0 && (
                <div>No subscription plans available.</div>
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
