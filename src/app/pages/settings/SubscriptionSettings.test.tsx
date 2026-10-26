import SubscriptionSettings from "@app/pages/settings/SubscriptionSettings";
import { SettingsProvider } from "@app/providers/Settings/provider";
import { ToastProvider } from "@app/providers/Toast/provider";
import { act, render, screen } from "@app/utils/test";
import { describe, expect, it, vi } from "vitest";

vi.mock("@app/providers/User", () => ({
  useUser: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

vi.mock("@app/utils/purchases", () => ({
  getCustomerInfo: vi.fn().mockResolvedValue({
    entitlements: { all: {} },
    activeSubscriptions: [],
  }),
  getPackages: vi.fn().mockResolvedValue([]),
  initializePurchasing: vi.fn(),
  restorePurchases: vi.fn(),
  purchasePackage: vi.fn(),
}));

describe("SubscriptionSettings component", () => {
  it("renders Terms of Use (EULA) and Privacy Policy links", async () => {
    await act(async () => {
      render(
        <ToastProvider>
          <SettingsProvider>
            <SubscriptionSettings />
          </SettingsProvider>
        </ToastProvider>,
      );
    });

    const eulaLink = screen.getByRole("link", { name: "Terms of Use (EULA)" });
    expect(eulaLink).toBeInTheDocument();
    expect(eulaLink).toHaveAttribute("href", "https://curi.ooo/terms");

    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute("href", "https://curi.ooo/privacy");
  });
});
