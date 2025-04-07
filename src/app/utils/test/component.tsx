import { BrowserMessageProvider } from "@app/providers/BrowserMessage/provider";
import { CacheProvider } from "@app/providers/Cache/provider";
import { CurrentItemProvider } from "@app/providers/CurrentItem/provider";
import { ItemsProvider } from "@app/providers/Items/provider";
import { SettingsProvider } from "@app/providers/Settings/provider";
import { ToastProvider } from "@app/providers/Toast/provider";
import { UserProvider } from "@app/providers/User/provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const DEFAULT_TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174002";
const DEFAULT_TEST_USERNAME = "defaultuser";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export const AllProviders = ({
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
