import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { BrowserMessageProvider } from "@web/providers/BrowserMessageProvider";
import { CacheProvider } from "@web/providers/CacheProvider";
import { CurrentItemProvider } from "@web/providers/CurrentItemProvider";
import { ItemsProvider } from "@web/providers/ItemsProvider";
import { SettingsProvider } from "@web/providers/SettingsProvider";
import { ToastProvider } from "@web/providers/ToastProvider";
import { UserProvider } from "@web/providers/UserProvider";
import React from "react";

import { DEFAULT_TEST_USER_ID, DEFAULT_TEST_USERNAME } from "./api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const AllProviders = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <UserProvider
          user={{
            id: DEFAULT_TEST_USER_ID,
            username: DEFAULT_TEST_USERNAME,
            email: "test@curi.ooo",
            newsletterEmail: null,
          }}
        >
          <SettingsProvider>
            <ToastProvider>
              <ItemsProvider>
                <CurrentItemProvider>
                  <CacheProvider>
                    <BrowserMessageProvider>{children}</BrowserMessageProvider>
                  </CacheProvider>
                </CurrentItemProvider>
              </ItemsProvider>
            </ToastProvider>
          </SettingsProvider>
        </UserProvider>
      </QueryClientProvider>
    </div>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult => render(ui, { wrapper: AllProviders, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
