"use client";
import React, { createContext, useState } from "react";

import {
  type GetItemsRequestSchema,
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
  fetchItems: (options: GetItemsRequestSchema) => Promise<void>;
};

interface ItemsProviderProps {
  children: React.ReactNode;
}

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  totalItems: 0,
  isLoading: true,
  fetchItems: (_options: GetItemsRequestSchema) => Promise.resolve(),
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
}: ItemsProviderProps): React.ReactNode => {
  const [items, setItems] = useState<ItemResult[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchItems = (options: GetItemsRequestSchema): void => {
    setLoading(true);
    fetch("/api/v1/items", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      searchParams: options,
    })
      .then(handleAPIResponse<GetItemsResponse>)
      .then((result) => {
        const { items, total } = result;
        if (!items) {
          throw Error("Failed to fetch items");
        }
        setItems(items);
        setTotalItems(total);
        setLoading(false);
      })
      .catch((error) => {
        log.error("Failed to fetch items", error);
        throw error;
      });
  };

  return (
    <ItemsContext.Provider value={{ items, totalItems, isLoading: loading, fetchItems }}>
      {children}
    </ItemsContext.Provider>
  );
};
