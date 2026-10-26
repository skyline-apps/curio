import { initOfflineQueueSync } from "@app/utils/offlineQueue";
import { HeroUIProvider } from "@heroui/react"; // eslint-disable-line no-restricted-imports
import { useQueryClient } from "@tanstack/react-query";
import React, { PropsWithChildren, useEffect } from "react";

import { AppLayoutProvider } from "./AppLayout/provider";
import { BrowserMessageProvider } from "./BrowserMessage/provider";
import { CacheProvider } from "./Cache/provider";
import { ClientProviders } from "./ClientProviders";
import { CurrentItemProvider } from "./CurrentItem/provider";
import { HighlightsProvider } from "./Highlights/provider";
import { ItemsProvider } from "./Items/provider";
import { SettingsProvider } from "./Settings/provider";
import { useToast } from "./Toast";
import { ToastProvider } from "./Toast/provider";
import { useUser } from "./User";
import { WalkthroughProvider } from "./Walkthrough/provider";

const OfflineSyncManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    return initOfflineQueueSync(queryClient, (count) => {
      showToast(
        `Synced ${count} offline ${count === 1 ? "action" : "actions"}.`,
        { disappearing: true },
      );
    });
  }, [queryClient, showToast]);

  return null;
};

const AuthenticatedProviders: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  const { user } = useUser();
  return user?.id ? (
    <SettingsProvider>
      <ItemsProvider>
        <CurrentItemProvider>
          <HighlightsProvider>
            <CacheProvider>
              <BrowserMessageProvider>
                <WalkthroughProvider>{children}</WalkthroughProvider>
              </BrowserMessageProvider>
            </CacheProvider>
          </HighlightsProvider>
        </CurrentItemProvider>
      </ItemsProvider>
    </SettingsProvider>
  ) : (
    <CurrentItemProvider>{children}</CurrentItemProvider>
  );
};

const Providers: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  return (
    <ClientProviders>
      <HeroUIProvider>
        <ToastProvider>
          <OfflineSyncManager />
          <AppLayoutProvider>
            <AuthenticatedProviders>{children}</AuthenticatedProviders>
          </AppLayoutProvider>
        </ToastProvider>
      </HeroUIProvider>
    </ClientProviders>
  );
};

export default Providers;
