"use client";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext } from "react";

import { type Highlight } from "@/app/api/v1/items/highlights/validation";

import {
  ITEM_CONTENT_QUERY_KEY,
  type ItemWithContent,
} from "./CurrentItemProvider";
import { type Item, ITEMS_QUERY_KEY, type ItemsPage } from "./ItemsProvider";

type ItemUpdate = { slug: string } & {
  metadata?: Partial<Item["metadata"]>;
  labels?: Partial<Item["labels"]>;
  highlights?: Highlight[];
};

export type CacheContextType = {
  invalidateCache: (slug?: string) => void;
  optimisticUpdateItems: (items: ItemUpdate[]) => void;
  optimisticRemoveItems: (itemSlugs: string[]) => void;
};

interface CacheProviderProps extends React.PropsWithChildren {}

export const CacheContext = createContext<CacheContextType>({
  invalidateCache: () => {},
  optimisticUpdateItems: () => {},
  optimisticRemoveItems: () => {},
});

export const CacheProvider: React.FC<CacheProviderProps> = ({
  children,
}: CacheProviderProps): React.ReactNode => {
  const queryClient = useQueryClient();

  const invalidateCache = useCallback(
    (slug?: string) => {
      if (slug) {
        queryClient.invalidateQueries({
          queryKey: [ITEM_CONTENT_QUERY_KEY, slug],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: [ITEM_CONTENT_QUERY_KEY] });
      }
      queryClient.invalidateQueries({ queryKey: [ITEMS_QUERY_KEY] });
    },
    [queryClient],
  );

  const optimisticUpdateItems = useCallback(
    (updatedItems: ItemUpdate[]) => {
      updatedItems.forEach((item) => {
        queryClient.setQueriesData(
          { queryKey: [ITEM_CONTENT_QUERY_KEY, item.slug] },
          (oldData: ItemWithContent) => {
            if (!oldData) return oldData;

            const labels = item.labels ? item.labels : oldData.item.labels;

            return {
              ...oldData,
              item: {
                ...oldData.item,
                ...item,
                metadata: { ...oldData.item.metadata, ...item.metadata },
                highlights:
                  "highlights" in item
                    ? item.highlights
                    : oldData.item.highlights,
                labels,
              },
            };
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
      queryClient.setQueriesData<InfiniteData<ItemsPage>>(
        { queryKey: [ITEMS_QUERY_KEY] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.filter(
                (item) => !itemSlugs.includes(item.slug),
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
  };

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): CacheContextType => useContext(CacheContext);
