import { CustomerInfo, Package, Purchases } from "@revenuecat/purchases-js";

export type { CustomerInfo, Package } from "@revenuecat/purchases-js";

export const initializePurchasing = (userId: string): void => {
  if (!import.meta.env.VITE_REVENUECAT_API_KEY) {
    throw new Error("Missing configuration for RevenueCat");
  }
  Purchases.configure(import.meta.env.VITE_REVENUECAT_API_KEY, userId);
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  return Purchases.getSharedInstance().getCustomerInfo();
};

export const getPackages = async (): Promise<Package[]> => {
  const offerings = await Purchases.getSharedInstance().getOfferings();
  return offerings.current?.availablePackages || [];
};

export const purchasePackage = async (rcPackage: Package): Promise<void> => {
  await Purchases.getSharedInstance().purchase({ rcPackage });
};
