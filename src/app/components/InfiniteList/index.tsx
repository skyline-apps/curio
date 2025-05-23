import PullToRefresh from "@app/components/PullToRefresh";
import Icon from "@app/components/ui/Icon";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useEffect } from "react";
import { LuBird, LuLeaf, LuPartyPopper } from "react-icons/lu";

interface InfiniteListProps<T> {
  listData: T[];
  hasNextPage: boolean;
  fetchNextPage: (refresh?: boolean) => Promise<void>;
  loadingError: string | null;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  clearSelectedItems: () => void;
  lastSelectionIndex: number | null;
  renderItem: (item: T, index: number) => React.ReactNode;
}

const InfiniteList = <T,>({
  listData,
  hasNextPage,
  fetchNextPage,
  loadingError,
  isLoading,
  isFetchingNextPage,
  clearSelectedItems,
  lastSelectionIndex,
  renderItem,
}: InfiniteListProps<T>): React.ReactElement => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: listData.length + 1, // Include an extra slot for the loading message
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
    gap: 4,
  });

  useEffect(() => {
    clearSelectedItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const virtualizedItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (lastSelectionIndex === null) return;
    rowVirtualizer.scrollToIndex(lastSelectionIndex);
  }, [lastSelectionIndex, rowVirtualizer]);

  useEffect(() => {
    const [lastItem] = [...virtualizedItems].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= listData.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    listData.length,
    isFetchingNextPage,
    virtualizedItems,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const rightSidebar = document.querySelector('[id="right-sidebar"]');
      if (rightSidebar?.contains(event.target as Node)) {
        return;
      }
      if (
        innerRef.current &&
        !innerRef.current.contains(event.target as Node)
      ) {
        clearSelectedItems();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clearSelectedItems]);

  return (
    <>
      <PullToRefresh
        onRefresh={async () => {
          await fetchNextPage(true);
        }}
      >
        {!isLoading && listData.length === 0 ? (
          <div
            id="infinite-list"
            className="flex flex-col h-full gap-2 text-sm text-secondary-800 items-center justify-center p-4"
          >
            <Icon
              className="animate-bounce text-secondary-800"
              icon={<LuBird />}
            />
            <p>Nothing here yet.</p>
          </div>
        ) : (
          <div
            ref={parentRef}
            id="infinite-list"
            className="h-[calc(100dvh-4rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto overflow-x-hidden"
          >
            {loadingError ? (
              <p className="text-sm text-secondary-800 p-4">{loadingError}</p>
            ) : (
              <div
                ref={innerRef}
                className="relative m-1"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
                {virtualizedItems.map((virtualRow) => {
                  const isLoaderRow = virtualRow.index > listData.length - 1;
                  const item = listData[virtualRow.index];

                  return (
                    <div
                      key={virtualRow.index}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className={
                        "absolute top-0 left-0 w-full " +
                        (isLoaderRow ? "flex items-center justify-center" : "")
                      }
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {isLoaderRow ? (
                        hasNextPage ? (
                          <div className="flex text-sm items-center gap-2 py-4 text-secondary-800">
                            <Icon
                              icon={<LuLeaf />}
                              className="animate-spin text-secondary-800"
                            />
                            Loading more...
                          </div>
                        ) : listData.length ? (
                          <div className="flex text-sm items-center gap-2 py-4 text-secondary-800">
                            <Icon
                              className="animate-ping text-secondary-800"
                              icon={<LuPartyPopper />}
                            />
                            You&apos;ve reached the end!
                          </div>
                        ) : null
                      ) : (
                        renderItem(item, virtualRow.index)
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </PullToRefresh>
    </>
  );
};

export default InfiniteList;
