"use client";
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  isFetchingNextPage: boolean;
  invalidateCache: () => void;
  optimisticUpdateItems: (items: ItemMetadata[]) => void;
  optimisticRemoveItems: (items: ItemMetadata[]) => void;
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
  invalidateCache: () => {},
  optimisticUpdateItems: () => {},
  optimisticRemoveItems: () => {},
  loadingError: null,
  hasNextPage: true,
  fetchItems: () => Promise.resolve(),
  searchQuery: "",
  setSearchQuery: () => {},
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
}: ItemsProviderProps): React.ReactNode => {
  const queryClient = useQueryClient();
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

  const optimisticUpdateItems = useCallback(
    (updatedItems: ItemMetadata[]) => {
      const key = ["items", serializedOptions];

      queryClient.setQueryData(key, (oldData: InfiniteData<ItemsPage>) => {
        if (!oldData) return oldData;

        const updatedItemsIds = new Map(
          updatedItems.map((item) => [item.id, item]),
        );

        const newData = {
          ...oldData,
          pages: oldData.pages.map((page: ItemsPage) => ({
            ...page,
            items: page.items.map((item: ItemMetadata) =>
              updatedItemsIds.get(item.id)
                ? updatedItemsIds.get(item.id)
                : item,
            ),
          })),
        };
        return newData;
      });
    },
    [queryClient, serializedOptions],
  );

  const optimisticRemoveItems = useCallback(
    (items: ItemMetadata[]) => {
      const key = ["items", serializedOptions];

      queryClient.setQueryData<InfiniteData<ItemsPage>>(key, (oldData) => {
        if (!oldData) return oldData;

        const itemIds = items.map((item) => item.id);

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => !itemIds.includes(item.id)),
          })),
        };
      });
    },
    [queryClient, serializedOptions],
  );

  const contextValue: ItemsContextType = {
    items: data?.pages.flatMap((p) => p.items) || [],
    totalItems: data?.pages[0]?.total || 0,
    isLoading,
    isFetching,
    isFetchingNextPage,
    invalidateCache,
    optimisticUpdateItems,
    optimisticRemoveItems,
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
