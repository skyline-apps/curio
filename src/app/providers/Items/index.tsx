import {
  type GetItemsRequest,
  type ItemResult,
  type PublicItemResult,
} from "@shared/v1/items";
import { createContext } from "react";

export const ITEMS_QUERY_KEY = "items";

export type Item = ItemResult;
export type PublicItem = PublicItemResult;

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
  currentFilters: GetItemsRequest["filters"];
};

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
  currentFilters: {},
});
