import {
  type GetHighlightsRequest,
  type GetHighlightsResponse,
} from "@web/app/api/v1/items/highlights/validation";
import { createContext } from "react";

export const HIGHLIGHTS_QUERY_KEY = "highlights";

export type HighlightItem = GetHighlightsResponse["highlights"][0];
export type HighlightSearchOptions = Omit<
  GetHighlightsRequest,
  "offset" | "limit"
>;

export type HighlightsContextType = {
  selectedHighlight: HighlightItem | null;
  selectedHighlightIndex: number | null;
  selectHighlight: (highlightId: string | null) => void;
  highlights: HighlightItem[];
  totalHighlights: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  loadingError: string | null;
  hasNextPage: boolean;
  fetchHighlights: (
    refresh?: boolean,
    options?: HighlightSearchOptions,
  ) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (search: string) => void;
};

export const HighlightsContext = createContext<HighlightsContextType>({
  selectedHighlight: null,
  selectedHighlightIndex: null,
  selectHighlight: () => {},
  highlights: [],
  totalHighlights: 0,
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  loadingError: null,
  hasNextPage: true,
  fetchHighlights: () => Promise.resolve(),
  searchQuery: "",
  setSearchQuery: () => {},
});
