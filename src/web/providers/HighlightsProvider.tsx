"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  type GetHighlightsRequest,
  type GetHighlightsResponse,
} from "@web/app/api/v1/items/highlights/validation";
import { useAppLayout } from "@web/providers/AppLayoutProvider";
import { handleAPIResponse } from "@web/utils/api";
import { createLogger } from "@web/utils/logger";
import React, { createContext, useCallback, useMemo, useState } from "react";

const log = createLogger("highlights-provider");

const HIGHLIGHTS_BATCH_SIZE = 20;

export const HIGHLIGHTS_QUERY_KEY = "highlights";

export type HighlightItem = GetHighlightsResponse["highlights"][0];
export type HighlightSearchOptions = Omit<
  GetHighlightsRequest,
  "offset" | "limit"
>;

export interface HighlightsPage {
  highlights: HighlightItem[];
  nextOffset?: number;
  total: number;
}

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

interface HighlightsProviderProps extends React.PropsWithChildren {}

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

export const HighlightsProvider: React.FC<HighlightsProviderProps> = ({
  children,
}: HighlightsProviderProps) => {
  const [currentOptions, setCurrentOptions] =
    useState<HighlightSearchOptions | null>(null);
  const [selectedHighlightId, setSelectedHighlightId] = React.useState<
    string | null
  >(null);
  const { updateAppLayout } = useAppLayout();

  const selectHighlight = useCallback(
    (highlightId: string | null) => {
      setSelectedHighlightId(highlightId);
      updateAppLayout({ rightSidebarOpen: !!highlightId });
    },
    [updateAppLayout],
  );

  const serializedOptions = useMemo((): string => {
    if (!currentOptions) return "no options";
    const keyedOptions = {
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
  } = useInfiniteQuery<HighlightsPage>({
    queryKey: [HIGHLIGHTS_QUERY_KEY, serializedOptions],
    queryFn: async ({ pageParam }): Promise<HighlightsPage> => {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries({
            ...(currentOptions?.search
              ? { search: currentOptions?.search }
              : {}),
            limit: HIGHLIGHTS_BATCH_SIZE,
            offset: pageParam,
          })
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        ),
      );

      const result = await fetch(
        `/api/v1/items/highlights?${params.toString()}`,
      ).then(handleAPIResponse<GetHighlightsResponse>);

      if (!result.highlights) {
        log.error("Failed to fetch highlights", result);
        throw new Error("Failed to fetch highlights");
      }

      return {
        highlights: result.highlights,
        nextOffset: result.nextOffset,
        total: result.total,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const fetchHighlights = useCallback(
    async (
      refresh?: boolean,
      options?: HighlightSearchOptions,
    ): Promise<void> => {
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
    setCurrentOptions((prev) => {
      if (!search) {
        const { search: _, ...rest } = prev || {};
        return rest;
      }
      return {
        ...prev,
        search,
        offset: undefined,
      };
    });
  }, []);

  const highlights = useMemo(() => {
    return data?.pages.flatMap((page) => page.highlights) ?? [];
  }, [data]);

  const selectedHighlight = useMemo(() => {
    return (
      highlights.find((highlight) => highlight.id === selectedHighlightId) ||
      null
    );
  }, [highlights, selectedHighlightId]);

  const selectedHighlightIndex = useMemo(() => {
    return selectedHighlightId
      ? highlights
          .map((h) => h.id)
          .findIndex((id) => id === selectedHighlightId)
      : null;
  }, [highlights, selectedHighlightId]);

  return (
    <HighlightsContext.Provider
      value={{
        highlights,
        totalHighlights: data?.pages[0]?.total || 0,
        isLoading,
        isFetching,
        isFetchingNextPage,
        loadingError: error ? error.message : null,
        hasNextPage: hasNextPage ?? false,
        fetchHighlights,
        selectedHighlight,
        selectedHighlightIndex,
        selectHighlight,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </HighlightsContext.Provider>
  );
};

export default HighlightsProvider;
