"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import React, { PropsWithChildren, useEffect, useState } from "react";

import AnalyticsPageView from "@/app/AnalyticsPageView";

import { KeyboardShortcutProvider } from "./KeyboardShortcutProvider";

export const ClientProviders: React.FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "always",
    });
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
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
