import { HighlightNavigationShortcuts } from "@app/components/Highlights/HighlightList/HighlightNavigationShortcuts";
import HighlightRow from "@app/components/Highlights/HighlightRow";
import HighlightSearch from "@app/components/Highlights/HighlightSearch";
import InfiniteList from "@app/components/InfiniteList";
import { HighlightsContext } from "@app/providers/Highlights";
import React, { useCallback, useContext } from "react";

type HighlightListProps = Record<never, never>;

const HighlightList: React.FC<
  HighlightListProps
> = ({}: HighlightListProps) => {
  const {
    highlights,
    hasNextPage,
    isFetchingNextPage,
    fetchHighlights,
    loadingError,
    selectedHighlight,
    selectHighlight,
    isLoading,
    totalHighlights,
  } = useContext(HighlightsContext);

  const clearSelectedItems = useCallback(() => {
    selectHighlight(null);
  }, [selectHighlight]);

  return (
    <>
      <HighlightNavigationShortcuts />
      <div className="flex h-8 w-full items-center gap-2 mb-2">
        <HighlightSearch highlightCount={totalHighlights} />
      </div>
      <InfiniteList
        listData={highlights}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchHighlights}
        loadingError={loadingError}
        isLoading={isLoading}
        clearSelectedItems={clearSelectedItems}
        lastSelectionIndex={
          selectedHighlight
            ? highlights.findIndex(
                (highlight) => highlight.id === selectedHighlight.id,
              )
            : null
        }
        renderItem={(item, _virtualRow) => <HighlightRow highlight={item} />}
      />
    </>
  );
};

export default HighlightList;
