"use client";
import React, { createContext, useCallback, useState } from "react";

import { GetItemContentResponse } from "@/app/api/v1/items/content/validation";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("current-item-provider");

export type ItemContent = Omit<
  Exclude<GetItemContentResponse, { error: string }>,
  "content"
> & {
  content?: string;
};

export type CurrentItemContextType = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentItem: ItemContent | null;
  populateCurrentItem: (item: ItemContent | null) => void;
  clearCurrentItem: () => void;
  loading: boolean;
  fetchContent: (path: string) => Promise<void>;
};

interface CurrentItemProviderProps {
  children: React.ReactNode;
}

export const CurrentItemContext = createContext<CurrentItemContextType>({
  sidebarOpen: true,
  setSidebarOpen: () => {},
  currentItem: null,
  populateCurrentItem: () => {},
  clearCurrentItem: () => {},
  loading: true,
  fetchContent: () => Promise.resolve(),
});

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const [currentItem, setCurrentItem] = useState<ItemContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const clearCurrentItem = (): void => {
    setCurrentItem(null);
    setSidebarOpen(false);
  };

  const populateCurrentItem = (item: ItemContent | null): void => {
    setCurrentItem(item);
    setSidebarOpen(!!item);
  };

  const fetchContent = useCallback(async (slug: string): Promise<void> => {
    if (!slug) {
      clearCurrentItem();
      return;
    }
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
        clearCurrentItem();
        throw result.error;
      }
      if (result) {
        setCurrentItem(result);
        setSidebarOpen(false);
      }
    } catch (error) {
      log.error(`Failed to fetch item content for ${slug}`, error);
      clearCurrentItem();
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CurrentItemContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        currentItem,
        populateCurrentItem,
        clearCurrentItem,
        loading,
        fetchContent,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
