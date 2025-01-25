"use client";
import React, { createContext, useState } from "react";

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
  fetchItems: (options: GetItemsRequest) => Promise<void>;
};

interface ItemsProviderProps {
  children: React.ReactNode;
}

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  totalItems: 0,
  isLoading: true,
  fetchItems: (_options: GetItemsRequest) => Promise.resolve(),
});

export const ItemsProvider: React.FC<ItemsProviderProps> = ({
  children,
}: ItemsProviderProps): React.ReactNode => {
  const [items, setItems] = useState<ItemResult[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchItems = async (options: GetItemsRequest): Promise<void> => {
    setLoading(true);
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(options).map(([key, value]) => [key, String(value)]),
      ),
    );
    await fetch(`/api/v1/items?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
    <ItemsContext.Provider
      value={{ items, totalItems, isLoading: loading, fetchItems }}
    >
      {children}
    </ItemsContext.Provider>
  );
};
