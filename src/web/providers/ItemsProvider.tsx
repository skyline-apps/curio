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
  fetchItems: (options?: GetItemsRequest, refetch?: boolean) => Promise<void>;
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

  const query = useInfiniteQuery<ItemsPage>({
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
    async (options?: GetItemsRequest, refetch?: boolean): Promise<void> => {
      setCurrentOptions(options || null);
      if (refetch) {
        await query.refetch();
      } else if (query.hasNextPage) {
        await query.fetchNextPage();
      }
    },
    [query],
  );

  const contextValue: ItemsContextType = {
    items: query.data?.pages.flatMap((p) => p.items) || [],
    totalItems: query.data?.pages[0]?.total || 0,
    isLoading: query.isFetching,
    loadingError: query.isRefetchError
      ? query.error?.message || "Error loading items."
      : null,
    hasMore: !!query.hasNextPage,
    fetchItems,
  };

  return (
    <ItemsContext.Provider value={contextValue}>
      {children}
    </ItemsContext.Provider>
  );
};
