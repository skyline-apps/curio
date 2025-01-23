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
  isLoading: boolean;
  fetchItems: () => Promise<void>;
};

interface ItemsProviderProps {
  children: React.ReactNode;
}

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  isLoading: true,
  fetchItems: (_options: GetItemsRequestSchema) => Promise.resolve(),
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
}: ItemsProviderProps): React.ReactNode => {
  const [items, setItems] = useState<ItemResult[]>([]);
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
        const { items } = result;
        if (!items) {
          throw Error("Failed to fetch items");
        }
        setItems(items);
        setLoading(false);
      })
      .catch((error) => {
        log.error("Failed to fetch items", error);
        throw error;
      });
  };

  return (
    <ItemsContext.Provider value={{ items, isLoading: loading, fetchItems }}>
      {children}
    </ItemsContext.Provider>
  );
};
