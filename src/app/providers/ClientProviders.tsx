import AnalyticsPageView from "@app/components/AnalyticsPageView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
            staleTime: 30 * 60 * 1000, // 30 minutes
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PHProvider client={posthog}>
        <AnalyticsPageView />
        <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
      </PHProvider>
    </QueryClientProvider>
  );
};
