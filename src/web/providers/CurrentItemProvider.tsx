"use client";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { GetItemContentResponse } from "@/app/api/v1/items/content/validation";
import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { Item, ItemsContext } from "@/providers/ItemsProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("current-item-provider");

export type ItemWithContent = Omit<
  Exclude<GetItemContentResponse, { error: string }>,
  "content"
> & {
  content?: string;
};

export const ITEM_CONTENT_QUERY_KEY = "itemContent";

export type CurrentItemContextType = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentItem: Item | null; // Metadata of currently loaded or selected item
  loadedItem: ItemWithContent | null; // Contents of currently loaded item
  selectedItems: Set<string>; // All selected item slugs
  selectItems: (
    slugs: string[],
    index: number,
    replace?: boolean, // Clear out all other selections for this one
    selectRange?: boolean, // Select a range from the lastSelectionIndex to this index
    startSelecting?: boolean, // Start selecting, even if we're replacing
  ) => void;
  clearSelectedItems: () => void;
  fetchContent: (slug: string, refresh?: boolean) => Promise<void>;
  loading: boolean;
  loadingError: string | null;
  lastSelectionIndex: number | null;
  setLastSelectionIndex: (index: number | null) => void;
  draftHighlight: Highlight | NewHighlight | null;
  setDraftHighlight: (highlight: Highlight | NewHighlight | null) => void;
  updateDraftHighlightNote: (note: string) => void;
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
  draftHighlight: null,
  setDraftHighlight: () => {},
  updateDraftHighlightNote: () => {},
});

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const pathname = usePathname();

  const [itemLoadedSlug, setItemLoadedSlug] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [lastSelectionIndex, setLastSelectionIndex] = useState<number | null>(
    null,
  );
  const [inSelectionMode, setInSelectionMode] = useState<boolean>(false);
  const [draftHighlight, setDraftHighlight] = useState<
    Highlight | NewHighlight | null
  >(null);

  const { items } = useContext(ItemsContext);

  const clearSelectedItems = (): void => {
    setSelectedItems(new Set());
    setItemLoadedSlug(null);
    setSidebarOpen(false);
    setLastSelectionIndex(null);
    setInSelectionMode(false);
    setDraftHighlight(null);
  };

  useEffect(() => {
    if (!pathname.startsWith("/items/")) {
      clearSelectedItems();
    }
  }, [pathname]);

  const selectItems = useCallback(
    (
      slugs: string[],
      index: number,
      replace: boolean = true,
      selectRange: boolean = false,
      startSelecting: boolean = false,
    ) => {
      if (replace && !inSelectionMode) {
        setSelectedItems(new Set(slugs));
        setSidebarOpen(!!slugs.length);
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
        if (typeof window !== "undefined" && window.innerWidth > 1048) {
          setSidebarOpen(!!slugs.length);
        } else {
          setSidebarOpen(false);
        }
      }
      setLastSelectionIndex(index);
      if (startSelecting) {
        setInSelectionMode(true);
      }
    },
    [items, lastSelectionIndex, selectedItems, inSelectionMode],
  );

  const { data, isLoading, error, refetch } = useQuery<ItemWithContent>({
    enabled: !!itemLoadedSlug,
    queryKey: [ITEM_CONTENT_QUERY_KEY, itemLoadedSlug],
    queryFn: async (): Promise<ItemWithContent> => {
      if (!itemLoadedSlug) throw new Error("No item to fetch");
      const searchParams = new URLSearchParams({
        slug: itemLoadedSlug,
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
          `Failed to fetch item content for ${itemLoadedSlug}`,
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
      if (slug === itemLoadedSlug) {
        if (!refresh) {
          return;
        } else {
          await refetch();
          return;
        }
      }
      setItemLoadedSlug(slug);
    },
    [itemLoadedSlug, refetch],
  );

  const firstItem =
    selectedItems.size === 1 ? selectedItems.values().next().value : null;

  const currentItem = useMemo(() => {
    if (itemLoadedSlug) {
      if (!data?.item && firstItem) {
        return items.find((item) => item.slug === firstItem) || null;
      }
      return data?.item || null;
    } else if (firstItem) {
      return items.find((item) => item.slug === firstItem) || null;
    }
    return null;
  }, [items, data, itemLoadedSlug, firstItem]);

  const loadedItem = useMemo(() => {
    return data || null;
  }, [data]);

  const updateDraftHighlightNote = useCallback(
    (note: string) => {
      if (draftHighlight === null) return;
      setDraftHighlight({
        ...draftHighlight,
        note,
      });
    },
    [draftHighlight],
  );

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
        draftHighlight,
        setDraftHighlight,
        updateDraftHighlightNote,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
