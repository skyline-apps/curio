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
  fetchContent: (path: string) => Promise<void>;
  loading: boolean;
  loadingError: string | null;
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
  fetchContent: () => Promise.resolve(),
  loading: true,
  loadingError: null,
});

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<ItemContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const clearCurrentItem = (): void => {
    setCurrentItem(null);
    setSidebarOpen(false);
  };

  const populateCurrentItem = (item: ItemContent | null): void => {
    setCurrentItem(item);
    setSidebarOpen(!!item);
  };

  const fetchContent = useCallback(async (slug: string): Promise<void> => {
    setLoadingError(null);
    if (!slug) {
      clearCurrentItem();
      return;
    }
    if (slug !== currentItem?.item.slug) {
      clearCurrentItem();
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
      if (!result || "error" in result) {
        log.error(`Failed to fetch item content for ${slug}`, result?.error);
        setLoadingError(`Failed to fetch item content.`);
        return;
      }
      if (result) {
        setCurrentItem(result);
        if (typeof window !== "undefined" && window.innerWidth > 1048) {
          setSidebarOpen(true);
        } else {
          setSidebarOpen(false);
        }
      }
    } catch (error) {
      log.error(`Failed to fetch item content for ${slug}`, error);
      setLoadingError(`Failed to fetch item content.`);
      return;
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
        fetchContent,
        loading,
        loadingError,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
