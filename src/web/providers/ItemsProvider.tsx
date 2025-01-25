"use client";
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

export type ItemsContextType = {
  items: ItemMetadata[];
  totalItems: number;
  isLoading: boolean;
  hasMore: boolean;
  fetchItems: (options?: GetItemsRequest, reset?: boolean) => Promise<void>;
};

interface ItemsProviderProps {
  children: React.ReactNode;
  initialLimit?: number;
}

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  totalItems: 0,
  isLoading: false,
  hasMore: true,
  fetchItems: () => Promise.resolve(),
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
  initialLimit = 20,
}: ItemsProviderProps): React.ReactNode => {
  const [items, setItems] = useState<ItemResult[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const fetchItems = useCallback(
    async (options: GetItemsRequest = {}, reset = false): Promise<void> => {
      if (!reset && loading) return;
      if (!reset && !hasMore) return;

      setLoading(true);

      if (reset) {
        setNextCursor(undefined);
        setItems([]);
      }

      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries({
            ...options,
            limit: options.limit || initialLimit,
            cursor: reset ? undefined : nextCursor,
          })
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        ),
      );

      try {
        const result = await fetch(`/api/v1/items?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }).then(handleAPIResponse<GetItemsResponse>);

        const { items: newItems, total, nextCursor: newCursor } = result;
        if (!newItems) {
          throw Error("Failed to fetch items");
        }

        setItems((prevItems) => {
          if (reset) {
            return newItems;
          }
          const existingIds = new Set(prevItems.map((item) => item.id));
          const uniqueNewItems = newItems.filter(
            (item) => !existingIds.has(item.id),
          );
          return [...prevItems, ...uniqueNewItems];
        });

        setTotalItems(total);
        setNextCursor(newCursor);
        setHasMore(!!newCursor);
      } catch (error) {
        log.error("Failed to fetch items", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, nextCursor, initialLimit],
  );

  return (
    <ItemsContext.Provider
      value={{
        items,
        totalItems,
        isLoading: loading,
        hasMore,
        fetchItems,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
};
