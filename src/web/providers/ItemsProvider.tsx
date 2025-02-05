"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
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
  loadingError: string | null;
  hasMore: boolean;
  fetchItems: (refresh?: boolean, options?: GetItemsRequest) => Promise<void>;
};

interface ItemsProviderProps extends React.PropsWithChildren {
  initialLimit?: number;
}

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  totalItems: 0,
  isLoading: false,
  loadingError: null,
  hasMore: true,
  fetchItems: () => Promise.resolve(),
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
  initialLimit = 20,
}: ItemsProviderProps): React.ReactNode => {
  // TODO: Handle other query options like search filters etc.
  const [currentOptions, setCurrentOptions] = useState<GetItemsRequest | null>(
    null,
  );

  const { data, fetchNextPage, refetch, hasNextPage, isFetching, error } =
    useInfiniteQuery<ItemsPage>({
      queryKey: ["items", initialLimit],
      queryFn: async ({ pageParam }): Promise<ItemsPage> => {
        const params = new URLSearchParams(
          Object.fromEntries(
            Object.entries({
              ...currentOptions,
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

  const contextValue: ItemsContextType = {
    items: data?.pages.flatMap((p) => p.items) || [],
    totalItems: data?.pages[0]?.total || 0,
    isLoading: isFetching,
    loadingError: error ? error.message || "Error loading items." : null,
    hasMore: !!hasNextPage,
    fetchItems,
  };

  return (
    <ItemsContext.Provider value={contextValue}>
      {children}
    </ItemsContext.Provider>
  );
};
