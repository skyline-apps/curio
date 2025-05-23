import { HeroUIProvider } from "@heroui/react"; // eslint-disable-line no-restricted-imports
import React, { PropsWithChildren } from "react";

import { AppLayoutProvider } from "./AppLayout/provider";
import { BrowserMessageProvider } from "./BrowserMessage/provider";
import { CacheProvider } from "./Cache/provider";
import { ClientProviders } from "./ClientProviders";
import { CurrentItemProvider } from "./CurrentItem/provider";
import { HighlightsProvider } from "./Highlights/provider";
import { ItemsProvider } from "./Items/provider";
import { SettingsProvider } from "./Settings/provider";
import { ToastProvider } from "./Toast/provider";
import { useUser } from "./User";
import { WalkthroughProvider } from "./Walkthrough/provider";

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
          <AppLayoutProvider>
            <AuthenticatedProviders>{children}</AuthenticatedProviders>
          </AppLayoutProvider>
        </ToastProvider>
      </HeroUIProvider>
    </ClientProviders>
  );
};

export default Providers;
