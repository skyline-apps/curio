import { useAppLayout } from "@app/providers/AppLayout";
import { Item, ItemsContext, PublicItem } from "@app/providers/Items";
import { ItemState } from "@app/schemas/db";
import { type Highlight } from "@app/schemas/v1/items/highlights";
import { GetItemContentResponse } from "@app/schemas/v1/public/items/content";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { useQuery } from "@tanstack/react-query";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { CurrentItemContext, ITEM_CONTENT_QUERY_KEY, ItemWithContent } from ".";

const log = createLogger("current-item-provider");

interface CurrentItemProviderProps {
  children: React.ReactNode;
}

export const CurrentItemProvider: React.FC<CurrentItemProviderProps> = ({
  children,
}: CurrentItemProviderProps): React.ReactNode => {
  const { pathname } = useLocation();

  const [itemLoadedSlug, setItemLoadedSlug] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastSelectionIndex, setLastSelectionIndex] = useState<number | null>(
    null,
  );
  const [currentPreviewItem, setCurrentPreviewItem] = useState<
    Item | PublicItem | null
  >(null);
  const [inSelectionMode, setInSelectionMode] = useState<boolean>(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(
    null,
  );

  const { updateAppLayout } = useAppLayout();
  // Note that this ItemsContext may not be available if CurrentItemProvider is being used for an
  // unauthenticated user. The core functionality of getting current item content should still work.
  const { items } = useContext(ItemsContext);

  const clearSelectedItems = useCallback((): void => {
    setSelectedItems(new Set());
    setItemLoadedSlug(null);
    setCurrentPreviewItem(null);
    setInSelectionMode(false);
    setSelectedHighlight(null);
    updateAppLayout({ rightSidebarOpen: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pathname.startsWith("/item/")) {
      clearSelectedItems();
    }
  }, [pathname, clearSelectedItems]);

  const maybeOpenSidebar = useCallback((): void => {
    if (typeof window !== "undefined") {
      if (window.innerWidth > 1048) {
        updateAppLayout({ rightSidebarOpen: true });
      } else {
        updateAppLayout({ rightSidebarOpen: false });
      }
    }
  }, [updateAppLayout]);

  const selectItems = useCallback(
    (
      slugs: string[],
      index: number,
      options?: {
        replace?: boolean;
        selectRange?: boolean;
        startSelecting?: boolean;
        showSidebar?: boolean;
      },
    ) => {
      setCurrentPreviewItem(null);
      const { replace, selectRange, startSelecting, showSidebar } = {
        replace: true,
        selectRange: false,
        startSelecting: false,
        showSidebar: true,
        ...options,
      };
      if (replace && !inSelectionMode) {
        setSelectedItems(new Set(slugs));
        updateAppLayout({ rightSidebarOpen: showSidebar && !!slugs.length });
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
        if (showSidebar) {
          maybeOpenSidebar();
        }
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
        const result = await authenticatedFetch(
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
    [itemLoadedSlug], // eslint-disable-line react-hooks/exhaustive-deps
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
        selectedHighlight,
        setSelectedHighlight,
        isEditable,
      }}
    >
      {children}
    </CurrentItemContext.Provider>
  );
};
