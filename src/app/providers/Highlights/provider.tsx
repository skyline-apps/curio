import { useAppLayout } from "@app/providers/AppLayout";
import { type GetHighlightsResponse } from "@app/schemas/v1/items/highlights";
import {
  authenticatedFetch,
  handleAPIResponse,
  isOfflineError,
} from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";

import {
  HIGHLIGHTS_QUERY_KEY,
  HighlightsContext,
  HighlightSearchOptions,
  HighlightsPage,
} from ".";

const log = createLogger("highlights-provider");

const HIGHLIGHTS_BATCH_SIZE = 20;

type HighlightsProviderProps = React.PropsWithChildren;

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
    enabled: !!currentOptions,
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

      const result = await authenticatedFetch(
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
        loadingError: !error || isOfflineError(error) ? null : error.message,
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
