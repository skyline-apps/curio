import { createLogger } from "@app/utils/logger";
import { Capacitor } from "@capacitor/core";
import {
  PACKAGE_TYPE,
  Purchases as PurchasesNative,
  PurchasesPackage,
} from "@revenuecat/purchases-capacitor";
import {
  CustomerInfo as CustomerInfoWeb,
  Package as PackageWeb,
  PackageType as PackageTypeWeb,
  Purchases as PurchasesWeb,
} from "@revenuecat/purchases-js";

// Export the Native types as the default "types" for external consumers where possible
export type { CustomerInfo as CustomerInfoNative } from "@revenuecat/purchases-capacitor";
export type { CustomerInfo as CustomerInfoWeb } from "@revenuecat/purchases-js";

// We alias this because we are creating a specific UnifiedPackage
export type RCPackageNative = PurchasesPackage;
export type RCPackageWeb = PackageWeb;

const log = createLogger("Purchases");

export interface UnifiedProduct {
  title: string;
  description: string;
  priceString: string;
  currencyCode: string; // 'USD', etc.
  identifier: string;
  billingPeriod: string; // 'year', 'month' - normalized
}

export interface UnifiedPackage {
  identifier: string; // '$rc_annual' etc.
  type: "ANNUAL" | "MONTHLY" | "WEEKLY" | "LIFETIME" | "CUSTOM" | "UNKNOWN";
  product: UnifiedProduct;
  // Underlying objects for the purchase call
  rcPackageNative?: PurchasesPackage;
  rcPackageWeb?: PackageWeb;
}

const isNative = Capacitor.isNativePlatform();

export const initializePurchasing = (userId: string): void => {
  let apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;

  if (isNative) {
    if (Capacitor.getPlatform() === "android") {
      apiKey = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || apiKey;
    } else if (Capacitor.getPlatform() === "ios") {
      apiKey = import.meta.env.VITE_REVENUECAT_API_KEY_IOS || apiKey;
    }
  }

  if (!apiKey) {
    log.error("Missing configuration for RevenueCat");
    return;
  }

  if (isNative) {
    PurchasesNative.configure({ apiKey, appUserID: userId });
  } else {
    PurchasesWeb.configure(apiKey, userId);
  }
};

export const getCustomerInfo = async (): Promise<
  import("@revenuecat/purchases-capacitor").CustomerInfo | CustomerInfoWeb
> => {
  if (isNative) {
    const result = await PurchasesNative.getCustomerInfo();
    return result.customerInfo;
  } else {
    return PurchasesWeb.getSharedInstance().getCustomerInfo();
  }
};

export const getPackages = async (): Promise<UnifiedPackage[]> => {
  if (isNative) {
    try {
      const offerings = await PurchasesNative.getOfferings();
      const current = offerings.current;

      if (!current) {
        log.warn("No 'current' offering found in RevenueCat response.");
      } else if (
        !current.availablePackages ||
        current.availablePackages.length === 0
      ) {
        log.warn("Current offering has no available packages.", current);
      }

      if (!current || !current.availablePackages) return [];

      return current.availablePackages.map((p: PurchasesPackage) => {
        const product = p.product;
        return {
          identifier: p.identifier,
          type: p.packageType,
          product: {
            title: product.title,
            description: product.description,
            priceString: product.priceString,
            currencyCode: product.currencyCode,
            identifier: product.identifier,
            billingPeriod:
              p.packageType === PACKAGE_TYPE.ANNUAL
                ? "year"
                : p.packageType === PACKAGE_TYPE.MONTHLY
                  ? "month"
                  : "unknown",
          },
          rcPackageNative: p,
        } as UnifiedPackage;
      });
    } catch (e) {
      log.error("Error fetching native offerings", e);
      return [];
    }
  } else {
    try {
      const offerings = await PurchasesWeb.getSharedInstance().getOfferings();
      const available = offerings.current?.availablePackages || [];

      return available.map((p) => {
        const product = p.webBillingProduct;
        const subOption = product.defaultSubscriptionOption?.base;

        let mappedType: UnifiedPackage["type"] = "UNKNOWN";
        if (p.packageType === PackageTypeWeb.Annual) mappedType = "ANNUAL";
        else if (p.packageType === PackageTypeWeb.Monthly)
          mappedType = "MONTHLY";
        else if (p.packageType === PackageTypeWeb.Weekly) mappedType = "WEEKLY";
        else if (p.packageType === PackageTypeWeb.Lifetime)
          mappedType = "LIFETIME";
        else if (p.packageType === PackageTypeWeb.Custom) mappedType = "CUSTOM";

        return {
          identifier: p.identifier,
          type: mappedType,
          product: {
            title: product.displayName || product.title,
            description: product.description || "",
            priceString: subOption?.price?.formattedPrice || "$0.00",
            currencyCode: subOption?.price?.currency || "USD",
            identifier: product.identifier,
            billingPeriod: subOption?.period?.unit || "unknown",
          },
          rcPackageWeb: p,
        } as UnifiedPackage;
      });
    } catch (e) {
      log.error("Error fetching web offerings", e);
      return [];
    }
  }
};

export const purchasePackage = async (
  pkg: UnifiedPackage,
  userEmail: string,
): Promise<void> => {
  if (isNative) {
    if (!pkg.rcPackageNative) throw new Error("Native package not found");
    await PurchasesNative.purchasePackage({ aPackage: pkg.rcPackageNative });
  } else {
    if (!pkg.rcPackageWeb) throw new Error("Web package not found");
    await PurchasesWeb.getSharedInstance().purchase({
      rcPackage: pkg.rcPackageWeb,
      customerEmail: userEmail,
    });
  }
};
