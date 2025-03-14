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

import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { GetItemContentResponse } from "@/app/api/v1/public/items/content/validation";
import { ItemState } from "@/db/schema";
import { useAppLayout } from "@/providers/AppLayoutProvider";
import { Item, ItemsContext, PublicItem } from "@/providers/ItemsProvider";
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
  currentItem: Item | PublicItem | null; // Metadata of currently loaded or selected item
  loadedItem: ItemWithContent | null; // Contents of currently loaded item
  isCurrentlyPreviewing: boolean; // Whether the current item is stored in query results
  inSelectionMode: boolean; // Whether the user is currently in selection mode
  selectedItems: Set<string>; // All selected item slugs
  selectItems: (
    // Selected items must be loaded by the ItemsProvider
    slugs: string[],
    index: number,
    replace?: boolean, // Clear out all other selections for this one
    selectRange?: boolean, // Select a range from the lastSelectionIndex to this index
    startSelecting?: boolean, // Start selecting, even if we're replacing
  ) => void;
  previewItem: (item: Item | PublicItem) => void;
  clearSelectedItems: () => void;
  fetchContent: (slug: string, refresh?: boolean) => Promise<void>;
  loading: boolean;
  fetching: boolean;
  loadingError: string | null;
  lastSelectionIndex: number | null;
  setLastSelectionIndex: (index: number | null) => void;
  draftHighlight: Highlight | NewHighlight | null;
  setDraftHighlight: (highlight: Highlight | NewHighlight | null) => void;
  updateDraftHighlightNote: (note: string) => void;
  isEditable: (item: Item | PublicItem | null | undefined) => item is Item;
};

interface CurrentItemProviderProps {
  children: React.ReactNode;
}

export const CurrentItemContext = createContext<CurrentItemContextType>({
  currentItem: null,
  loadedItem: null,
  isCurrentlyPreviewing: false,
  inSelectionMode: false,
  selectedItems: new Set<string>(),
  selectItems: () => {},
  previewItem: () => {},
  clearSelectedItems: () => {},
  fetchContent: () => Promise.resolve(),
  loading: true,
  fetching: false,
  loadingError: null,
  lastSelectionIndex: null,
  setLastSelectionIndex: () => {},
  draftHighlight: null,
  setDraftHighlight: () => {},
  updateDraftHighlightNote: () => {},
  isEditable: (item: Item | PublicItem | null | undefined): item is Item => {
    return item ? typeof item.profileItemId === "string" : false;
  },
});

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const pathname = usePathname();

  const [itemLoadedSlug, setItemLoadedSlug] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastSelectionIndex, setLastSelectionIndex] = useState<number | null>(
    null,
  );
  const [currentPreviewItem, setCurrentPreviewItem] = useState<
    Item | PublicItem | null
  >(null);
  const [inSelectionMode, setInSelectionMode] = useState<boolean>(false);
  const [draftHighlight, setDraftHighlight] = useState<
    Highlight | NewHighlight | null
  >(null);

  const { updateAppLayout } = useAppLayout();
  // Note that this ItemsContext may not be available if CurrentItemProvider is being used for an
  // unauthenticated user. The core functionality of getting current item content should still work.
  const { items } = useContext(ItemsContext);

  const clearSelectedItems = useCallback((): void => {
    setSelectedItems(new Set());
    setItemLoadedSlug(null);
    setCurrentPreviewItem(null);
    setInSelectionMode(false);
    setDraftHighlight(null);
    updateAppLayout({ rightSidebarOpen: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pathname.startsWith("/item/")) {
      clearSelectedItems();
    }
  }, [pathname, clearSelectedItems]);

  const maybeOpenSidebar = useCallback((): void => {
    if (typeof window !== "undefined" && window.innerWidth > 1048) {
      updateAppLayout({ rightSidebarOpen: true });
    } else {
      updateAppLayout({ rightSidebarOpen: false });
    }
  }, [updateAppLayout]);

  const selectItems = useCallback(
    (
      slugs: string[],
      index: number,
      replace: boolean = true,
      selectRange: boolean = false,
      startSelecting: boolean = false,
    ) => {
      setCurrentPreviewItem(null);
      if (replace && !inSelectionMode) {
        setSelectedItems(new Set(slugs));
        updateAppLayout({ rightSidebarOpen: !!slugs.length });
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
        maybeOpenSidebar();
      }
      setLastSelectionIndex(index);
      if (startSelecting) {
        setInSelectionMode(true);
      }
    },
    [
      items,
      lastSelectionIndex,
      selectedItems,
      inSelectionMode,
      maybeOpenSidebar,
      updateAppLayout,
    ],
  );

  const previewItem = useCallback(
    (item: Item | PublicItem) => {
      setCurrentPreviewItem(item);
      updateAppLayout({ rightSidebarOpen: true });
    },
    [setCurrentPreviewItem, updateAppLayout],
  );

  const { data, isLoading, error, refetch, isPending } =
    useQuery<ItemWithContent>({
      enabled: !!itemLoadedSlug,
      queryKey: [ITEM_CONTENT_QUERY_KEY, itemLoadedSlug],
      queryFn: async (): Promise<ItemWithContent> => {
        if (!itemLoadedSlug) throw new Error("No item to fetch");
        const searchParams = new URLSearchParams({
          slug: itemLoadedSlug,
        });
        const result = await fetch(
          `/api/v1/public/items/content?${searchParams.toString()}`,
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
          setCurrentPreviewItem(null);
          maybeOpenSidebar();
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

  function isEditable(
    item: Item | PublicItem | null | undefined,
  ): item is Item {
    return item
      ? typeof item.profileItemId === "string" &&
          "state" in item.metadata &&
          item.metadata.state !== ItemState.DELETED
      : false;
  }

  const currentItem = useMemo(() => {
    let item = null;
    if (itemLoadedSlug) {
      if (!data?.item && firstItem) {
        item = items.find((item) => item.slug === firstItem) || null;
      } else {
        item = data?.item || null;
      }
    } else if (currentPreviewItem) {
      item = currentPreviewItem;
    } else if (firstItem) {
      item = items.find((item) => item.slug === firstItem) || null;
    }

    if (isEditable(item)) {
      return item;
    } else {
      return item as PublicItem;
    }
  }, [items, data, itemLoadedSlug, currentPreviewItem, firstItem]);

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
        currentItem,
        loadedItem,
        isCurrentlyPreviewing: !!currentPreviewItem,
        inSelectionMode,
        selectedItems,
        selectItems,
        previewItem,
        clearSelectedItems,
        fetchContent,
        loading: isLoading || isPending,
        fetching: isLoading,
        loadingError: error ? error.message || "Error loading items." : null,
        lastSelectionIndex,
        setLastSelectionIndex,
        draftHighlight,
        setDraftHighlight,
        updateDraftHighlightNote,
        isEditable,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
