"use client";
import { useQuery } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { GetItemContentResponse } from "@/app/api/v1/items/content/validation";
import { ItemMetadata, ItemsContext } from "@/providers/ItemsProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("current-item-provider");

export type Item = Omit<
  Exclude<GetItemContentResponse, { error: string }>,
  "content"
> & {
  content?: string;
};

export type CurrentItemContextType = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentItem: ItemMetadata | null;
  loadedItem: Item | null;
  selectedItems: string[];
  selectItems: (slugs: string[]) => void;
  unselectItems: () => void;
  fetchContent: (slug: string, refresh?: boolean) => Promise<void>;
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
  loadedItem: null,
  selectedItems: [],
  selectItems: () => {},
  unselectItems: () => {},
  fetchContent: () => Promise.resolve(),
  loading: true,
  loadingError: null,
});

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const [currentItemSlug, setCurrentItemSlug] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const { items } = useContext(ItemsContext);

  const unselectItems = (): void => {
    setSelectedItems([]);
    setCurrentItemSlug(null);
    setSidebarOpen(false);
  };

  const selectItems = (slugs: string[]): void => {
    setSelectedItems(slugs);
    setCurrentItemSlug(null);
    if (typeof window !== "undefined" && window.innerWidth > 1048) {
      setSidebarOpen(slugs.length > 0);
    } else {
      setSidebarOpen(false);
    }
  };

  const { data, isLoading, error, refetch } = useQuery<Item>({
    enabled: !!currentItemSlug,
    queryKey: ["itemContent", currentItemSlug],
    queryFn: async (): Promise<Item> => {
      if (!currentItemSlug) throw new Error("No item to fetch");
      const searchParams = new URLSearchParams({
        slug: currentItemSlug,
      });
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
        log.error(
          `Failed to fetch item content for ${currentItemSlug}`,
          result?.error,
        );
        throw new Error(`Failed to fetch item content`);
      }
      if (result) {
        if (typeof window !== "undefined" && window.innerWidth > 1048) {
          setSidebarOpen(true);
        } else {
          setSidebarOpen(false);
        }
      }
      return result;
    },
  });

  const fetchContent = useCallback(
    async (slug: string, refresh?: boolean): Promise<void> => {
      if (slug === currentItemSlug) {
        if (!refresh) {
          return;
        } else {
          await refetch();
        }
      }
      setCurrentItemSlug(slug);
    },
    [currentItemSlug, refetch],
  );

  const currentItem = useMemo(() => {
    if (currentItemSlug) {
      if (!data?.item && selectedItems.length === 1) {
        return items.find((item) => item.slug === selectedItems[0]) || null;
      }
      return data?.item || null;
    } else if (selectedItems.length === 1) {
      return items.find((item) => item.slug === selectedItems[0]) || null;
    }
    return null;
  }, [items, data, selectedItems, currentItemSlug]);

  const loadedItem = useMemo(() => {
    if (!currentItem) return null;
    return {
      item: currentItem,
      content: data?.content,
    };
  }, [data, currentItem]);

  return (
    <CurrentItemContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        currentItem,
        loadedItem,
        selectedItems,
        selectItems,
        unselectItems,
        fetchContent,
        loading: isLoading,
        loadingError: error ? error.message || "Error loading items." : null,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
