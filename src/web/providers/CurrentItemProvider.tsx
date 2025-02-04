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
  currentItem: ItemMetadata | null; // Metadata of currently loaded or selected item
  loadedItem: Item | null; // Contents of currently loaded item
  selectedItems: Set<string>; // All selected item slugs
  selectItems: (
    slugs: string[],
    index: number,
    replace?: boolean,
    selectRange?: boolean,
  ) => void;
  clearSelectedItems: () => void;
  fetchContent: (slug: string, refresh?: boolean) => Promise<void>;
  loading: boolean;
  loadingError: string | null;
  lastSelectionIndex: number | null;
  setLastSelectionIndex: (index: number | null) => void;
};

interface CurrentItemProviderProps {
  children: React.ReactNode;
}

export const CurrentItemContext = createContext<CurrentItemContextType>({
  sidebarOpen: true,
  setSidebarOpen: () => {},
  currentItem: null,
  loadedItem: null,
  selectedItems: new Set<string>(),
  selectItems: () => {},
  clearSelectedItems: () => {},
  fetchContent: () => Promise.resolve(),
  loading: true,
  loadingError: null,
  lastSelectionIndex: null,
  setLastSelectionIndex: () => {},
});

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const [currentItemSlug, setCurrentItemSlug] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [lastSelectionIndex, setLastSelectionIndex] = useState<number | null>(
    null,
  );

  const { items } = useContext(ItemsContext);

  const clearSelectedItems = (): void => {
    setSelectedItems(new Set());
    setCurrentItemSlug(null);
    setSidebarOpen(false);
    setLastSelectionIndex(null);
  };

  const selectItems = useCallback(
    (
      slugs: string[],
      index: number,
      replace: boolean = true,
      selectRange: boolean = false,
    ) => {
      if (replace) {
        setSelectedItems(new Set(slugs));
      } else if (selectRange && lastSelectionIndex !== null) {
        // Handle shift-click range selection
        const start = Math.min(lastSelectionIndex, index);
        const end = Math.max(lastSelectionIndex, index);
        const itemsInRange = items
          .slice(start, end + 1)
          .map((item) => item.slug);
        setSelectedItems(new Set([...selectedItems, ...itemsInRange]));
      } else {
        // Handle ctrl/cmd-click multi-selection
        const newSelection = new Set(selectedItems);
        slugs.forEach((slug) => {
          if (newSelection.has(slug)) {
            newSelection.delete(slug);
          } else {
            newSelection.add(slug);
          }
        });
        setSelectedItems(newSelection);
      }
      setLastSelectionIndex(index);
      if (typeof window !== "undefined" && window.innerWidth > 1048) {
        setSidebarOpen(!!slugs.length);
      } else {
        setSidebarOpen(false);
      }
    },
    [items, lastSelectionIndex, selectedItems],
  );

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

  const firstItem =
    selectedItems.size === 1 ? selectedItems.values().next().value : null;

  const currentItem = useMemo(() => {
    if (currentItemSlug) {
      if (!data?.item && firstItem) {
        return items.find((item) => item.slug === firstItem) || null;
      }
      return data?.item || null;
    } else if (firstItem) {
      return items.find((item) => item.slug === firstItem) || null;
    }
    return null;
  }, [items, data, currentItemSlug, firstItem]);

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
        clearSelectedItems,
        fetchContent,
        loading: isLoading,
        loadingError: error ? error.message || "Error loading items." : null,
        lastSelectionIndex,
        setLastSelectionIndex,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
