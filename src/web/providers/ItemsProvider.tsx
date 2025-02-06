"use client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useState } from "react";

import {
  type GetItemsRequest,
  type GetItemsResponse,
  type ItemResult,
} from "@/app/api/v1/items/validation";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("items-provider");

export type ItemMetadata = ItemResult;
interface ItemsPage {
  items: ItemMetadata[];
  total: number;
  nextCursor?: string;
}

export type ItemsContextType = {
  items: ItemMetadata[];
  totalItems: number;
  isLoading: boolean;
  isFetching: boolean;
  invalidateCache: () => void;
  loadingError: string | null;
  hasMore: boolean;
  fetchItems: (refresh?: boolean, options?: GetItemsRequest) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (search: string) => void;
};

interface ItemsProviderProps extends React.PropsWithChildren {
  initialLimit?: number;
}

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  totalItems: 0,
  isLoading: false,
  isFetching: false,
  invalidateCache: () => {},
  loadingError: null,
  hasMore: true,
  fetchItems: () => Promise.resolve(),
  searchQuery: "",
  setSearchQuery: () => {},
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
  initialLimit = 20,
}: ItemsProviderProps): React.ReactNode => {
  const queryClient = useQueryClient();
  const [currentOptions, setCurrentOptions] = useState<GetItemsRequest | null>(
    null,
  );

  const serializeOptions = (currentOptions: GetItemsRequest | null): string => {
    if (!currentOptions) return "no options";
    const keyedOptions = {
      ...(currentOptions?.filters ? { filters: currentOptions.filters } : {}),
      ...(currentOptions.search ? { search: currentOptions.search } : {}),
    };
    return JSON.stringify(keyedOptions);
  };

  const {
    data,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetching,
    isLoading,
    error,
  } = useInfiniteQuery<ItemsPage>({
    enabled: !!currentOptions,
    queryKey: ["items", initialLimit, serializeOptions(currentOptions)],
    queryFn: async ({ pageParam }): Promise<ItemsPage> => {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries({
            ...(currentOptions?.filters
              ? { filters: JSON.stringify(currentOptions?.filters) }
              : {}),
            ...(currentOptions?.search
              ? { search: currentOptions?.search }
              : {}),
            limit: currentOptions?.limit || initialLimit,
            cursor: pageParam,
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
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
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
    setCurrentOptions((prev) => ({
      ...prev,
      search,
    }));
  }, []);

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  }, [queryClient]);

  const contextValue: ItemsContextType = {
    items: data?.pages.flatMap((p) => p.items) || [],
    totalItems: data?.pages[0]?.total || 0,
    isLoading,
    isFetching,
    invalidateCache,
    loadingError: error ? error.message || "Error loading items." : null,
    hasMore: !!hasNextPage,
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
