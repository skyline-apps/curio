import AnalyticsPageView from "@app/components/AnalyticsPageView";
import { asyncStoragePersister } from "@app/utils/storage";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import React, { PropsWithChildren, useEffect, useState } from "react";

import { KeyboardShortcutProvider } from "./KeyboardShortcuts/provider";

export const ClientProviders: React.FC<PropsWithChildren> = ({ children }) => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
  useEffect(() => {
    if (!posthogKey || !posthogHost) return;
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "always",
    });
  }, [posthogKey, posthogHost]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Infinity,
            staleTime: 30 * 60 * 1000, // 30 minutes
            retry: 1,
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        dehydrateOptions: {
          shouldDehydrateQuery: () => true, // https://github.com/TanStack/query/discussions/2207
        },
      }}
    >
      <PHProvider client={posthog}>
        <AnalyticsPageView />
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      </PHProvider>
    </PersistQueryClientProvider>
  );
};
