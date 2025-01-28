"use client";
import React, { createContext, useCallback, useState } from "react";

import { GetItemContentResponse } from "@/app/api/v1/items/content/validation";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("current-item-provider");

export type ItemContent = Exclude<GetItemContentResponse, { error: string }>;

export type CurrentItemContextType = {
  currentItem: ItemContent | null;
  loading: boolean;
  fetchContent: (path: string) => Promise<void>;
};

interface CurrentItemProviderProps {
  children: React.ReactNode;
}

export const CurrentItemContext = createContext<CurrentItemContextType>({
  currentItem: null,
  loading: true,
  fetchContent: () => Promise.resolve(),
});

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const [currentItem, setCurrentItem] = useState<ItemContent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async (slug: string): Promise<void> => {
    if (!slug) return;
    const searchParams = new URLSearchParams({
      slug,
    });
    try {
      setLoading(true);
      const result = await fetch(
        `/api/v1/items/content?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      ).then(handleAPIResponse<GetItemContentResponse>);
      if ("error" in result) {
        log.error(`Failed to fetch item content for ${slug}`, result.error);
        throw result.error;
      }
      setCurrentItem((prev) => {
        if (!result) return prev;
        return { ...result };
      });
    } catch (error) {
      log.error(`Failed to fetch item content for ${slug}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CurrentItemContext.Provider
      value={{
        currentItem,
        loading,
        fetchContent,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
