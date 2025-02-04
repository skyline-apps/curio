"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { PropsWithChildren, useState } from "react";

import { KeyboardShortcutProvider } from "./KeyboardShortcutProvider";

export const ClientProviders: React.FC<PropsWithChildren> = ({ children }) => {
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
      <KeyboardShortcutProvider>{children}</KeyboardShortcutProvider>
    </QueryClientProvider>
  );
};
