import { PROFILE_QUERY_KEY } from "@app/components/Profile/useProfile";
import {
  ITEM_CONTENT_QUERY_KEY,
  type ItemWithContent,
} from "@app/providers/CurrentItem";
import {
  type HighlightItem,
  HIGHLIGHTS_QUERY_KEY,
  type HighlightsPage,
} from "@app/providers/Highlights";
import {
  type Item,
  ITEMS_QUERY_KEY,
  type ItemsPage,
} from "@app/providers/Items";
import { useSettings } from "@app/providers/Settings";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import React, { useCallback } from "react";

import {
  addPendingRemovedItemSlugs,
  CacheContext,
  CacheContextType,
  HighlightUpdate,
  ItemUpdate,
  pendingRemovedItemSlugs,
} from "./";

type CacheProviderProps = React.PropsWithChildren;

export const CacheProvider: React.FC<CacheProviderProps> = ({
  children,
}: CacheProviderProps): React.ReactNode => {
  const queryClient = useQueryClient();
  const { username } = useSettings();

  const invalidateCache = useCallback(
    async (slug?: string): Promise<void> => {
      if (slug) {
        await queryClient.invalidateQueries({
          queryKey: [ITEM_CONTENT_QUERY_KEY, slug],
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: [ITEM_CONTENT_QUERY_KEY],
        });
      }
      await queryClient.invalidateQueries({ queryKey: [ITEMS_QUERY_KEY] });
      if (username) {
        await queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, username],
        });
      }
    },
    [queryClient, username],
  );

  const optimisticUpdateItems = useCallback(
    (updatedItems: ItemUpdate[]) => {
      updatedItems.forEach((item) => {
        queryClient.setQueriesData(
          { queryKey: [ITEM_CONTENT_QUERY_KEY, item.slug] },
          (oldData: ItemWithContent) => {
            if (!oldData) return oldData;

            const labels = item.labels ? item.labels : oldData.item.labels;
            oldData.item.labels = labels;
            if ("highlights" in item && "highlights" in oldData.item) {
              oldData.item.highlights = item.highlights;
            }
            oldData.item.metadata = {
              ...oldData.item.metadata,
              ...item.metadata,
            };
            return oldData;
          },
        );
      });

      queryClient.setQueriesData(
        { queryKey: [ITEMS_QUERY_KEY] },
        (oldData: InfiniteData<ItemsPage>) => {
          if (!oldData) return oldData;

          const updatedItemsSlugs = new Map(
            updatedItems.map((item) => [item.slug, item]),
          );

          const newData = {
            ...oldData,
            pages: oldData.pages.map((page: ItemsPage) => ({
              ...page,
              items: page.items.map((item: Item) =>
                updatedItemsSlugs.get(item.slug)
                  ? {
                      ...item,
                      ...updatedItemsSlugs.get(item.slug),
                      metadata: {
                        ...item.metadata,
                        ...updatedItemsSlugs.get(item.slug)?.metadata,
                      },
                      labels: item.labels
                        ? item.labels
                        : updatedItemsSlugs.get(item.slug)?.labels,
                    }
                  : item,
              ),
            })),
          };
          return newData;
        },
      );
    },
    [queryClient],
  );

  const optimisticRemoveItems = useCallback(
    (itemSlugs: string[]) => {
      addPendingRemovedItemSlugs(itemSlugs);
      void queryClient.cancelQueries({ queryKey: [ITEMS_QUERY_KEY] });

      queryClient.setQueriesData<InfiniteData<ItemsPage>>(
        { queryKey: [ITEMS_QUERY_KEY] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.filter(
                (item) => !pendingRemovedItemSlugs.has(item.slug),
              ),
            })),
          };
        },
      );
    },
    [queryClient],
  );

  const optimisticUpdateHighlights = useCallback(
    (highlights: HighlightUpdate[]) => {
      queryClient.setQueriesData<InfiniteData<HighlightsPage>>(
        { queryKey: [HIGHLIGHTS_QUERY_KEY] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              highlights: page.highlights.map((highlight: HighlightItem) =>
                highlights.find((h) => h.id === highlight.id)
                  ? {
                      ...highlight,
                      ...highlights.find((h) => h.id === highlight.id),
                      noteExcerpt: undefined,
                    }
                  : highlight,
              ),
            })),
          };
        },
      );
    },
    [queryClient],
  );

  const optimisticRemoveHighlights = useCallback(
    (highlightIds: string[]) => {
      queryClient.setQueriesData<InfiniteData<HighlightsPage>>(
        { queryKey: [HIGHLIGHTS_QUERY_KEY] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              highlights: page.highlights.filter(
                (highlight: HighlightItem) =>
                  !highlightIds.includes(highlight.id),
              ),
            })),
          };
        },
      );
    },
    [queryClient],
  );

  const contextValue: CacheContextType = {
    invalidateCache,
    optimisticUpdateItems,
    optimisticRemoveItems,
    optimisticUpdateHighlights,
    optimisticRemoveHighlights,
  };

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};
