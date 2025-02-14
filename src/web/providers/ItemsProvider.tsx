"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { createContext, useCallback, useMemo, useState } from "react";

import {
  type GetItemsRequest,
  type GetItemsResponse,
  type ItemResult,
} from "@/app/api/v1/items/validation";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("items-provider");

export const ITEMS_BATCH_SIZE = 20;

export const ITEMS_QUERY_KEY = "items";

export type Item = ItemResult;

export interface ItemsPage {
  items: Item[];
  total: number;
  nextCursor?: string;
  nextOffset?: number;
}

export type ItemsContextType = {
  items: Item[];
  totalItems: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  loadingError: string | null;
  hasNextPage: boolean;
  fetchItems: (refresh?: boolean, options?: GetItemsRequest) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (search: string) => void;
};

interface ItemsProviderProps extends React.PropsWithChildren {}

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  totalItems: 0,
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  loadingError: null,
  hasNextPage: true,
  fetchItems: () => Promise.resolve(),
  searchQuery: "",
  setSearchQuery: () => {},
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
}: ItemsProviderProps): React.ReactNode => {
  const [currentOptions, setCurrentOptions] = useState<GetItemsRequest | null>(
    null,
  );

  const serializedOptions = useMemo((): string => {
    if (!currentOptions) return "no options";
    const keyedOptions = {
      ...(currentOptions?.filters ? { filters: currentOptions.filters } : {}),
      ...(currentOptions.search ? { search: currentOptions.search } : {}),
    };
    return JSON.stringify(keyedOptions);
  }, [currentOptions]);

  const {
    data,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<ItemsPage>({
    enabled: !!currentOptions,
    queryKey: ["items", serializedOptions],
    queryFn: async ({ pageParam }): Promise<ItemsPage> => {
      const isSearch = !!currentOptions?.search;
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries({
            ...(currentOptions?.filters
              ? { filters: JSON.stringify(currentOptions?.filters) }
              : {}),
            ...(currentOptions?.search
              ? { search: currentOptions?.search }
              : {}),
            limit: ITEMS_BATCH_SIZE,
            ...(isSearch ? { offset: pageParam } : { cursor: pageParam }),
          })
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        ),
      );

      const result = await fetch(`/api/v1/items?${params.toString()}`).then(
        handleAPIResponse<GetItemsResponse>,
      );

      if (!result.items) {
        log.error("Failed to fetch items", result);
        throw new Error("Failed to fetch items");
      }

      return {
        items: result.items,
        total: result.total,
        nextCursor: result.nextCursor,
        nextOffset: result.nextOffset,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (currentOptions?.search) {
        return lastPage.nextOffset;
      }
      return lastPage.nextCursor;
    },
  });

  const fetchItems = useCallback(
    async (refresh?: boolean, options?: GetItemsRequest): Promise<void> => {
      if (options) {
        setCurrentOptions(options);
      }
      if (refresh) {
        await refetch();
      } else if (hasNextPage) {
        await fetchNextPage();
      }
    },
    [refetch, fetchNextPage, hasNextPage],
  );

  const searchQuery = currentOptions?.search || "";
  const setSearchQuery = useCallback((search: string) => {
    setCurrentOptions((prev) => {
      if (!search) {
        // If clearing search, remove search and offset
        const { search: _, offset: __, ...rest } = prev || {};
        return rest;
      }
      // If setting search, remove cursor and ensure offset is undefined initially
      const { cursor: _, ...rest } = prev || {};
      return {
        ...rest,
        search,
        offset: undefined,
      };
    });
  }, []);

  const contextValue: ItemsContextType = {
    items: data?.pages.flatMap((p) => p.items) || [],
    totalItems: data?.pages[0]?.total || 0,
    isLoading,
    isFetching,
    isFetchingNextPage,
    loadingError: error ? error.message || "Error loading items." : null,
    hasNextPage,
    fetchItems,
    searchQuery,
    setSearchQuery,
  };

  return (
    <ItemsContext.Provider value={contextValue}>
      {children}
    </ItemsContext.Provider>
  );
};
