"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useContext, useEffect } from "react";
import { LuBird, LuPartyPopper } from "react-icons/lu";

import ItemCard from "@/components/Items/ItemCard";
import { ItemNavigation } from "@/components/Items/ItemList/ItemNavigation";
import ItemsActions from "@/components/Items/ItemList/ItemsActions";
import ItemSearch from "@/components/Items/ItemList/ItemSearch";
import Icon from "@/components/ui/Icon";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";

interface ItemListProps {}

const ItemList: React.FC<ItemListProps> = ({}: ItemListProps) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const { lastSelectionIndex, selectItems, clearSelectedItems } =
    useContext(CurrentItemContext);

  const {
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchItems,
    items,
    totalItems,
    loadingError,
  } = useContext(ItemsContext);

  const rowVirtualizer = useVirtualizer({
    count: items.length + 1, // Include an extra slot for the loading message
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
    gap: 4,
  });

  const virtualizedItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    clearSelectedItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      lastItem.index >= items.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchItems();
    }
  }, [
    hasNextPage,
    fetchItems,
    items.length,
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
      <ItemNavigation />
      <div className="flex h-8 w-full items-end gap-2 mb-2">
        <ItemSearch />
        <ItemsActions />
      </div>
      {!isLoading && totalItems === 0 ? (
        <div className="flex h-full gap-2 text-sm text-secondary-800 items-center justify-center p-4">
          <p>Nothing here yet.</p>
          <Icon className="text-secondary-800" icon={<LuBird />} />
        </div>
      ) : (
        <div ref={parentRef} className="h-[calc(100vh-4rem)] overflow-y-auto">
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
                const isLoaderRow = virtualRow.index > items.length - 1;

                if (isLoaderRow) {
                  return hasNextPage ? (
                    <div
                      key="loader"
                      className="absolute left-0 top-0 w-full flex items-center justify-center text-secondary-800 text-sm py-4"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      Loading more...
                    </div>
                  ) : (
                    !isLoading && (
                      <div
                        key="no-more"
                        className="absolute left-0 top-0 w-full flex gap-2 items-center justify-center text-secondary-800 text-sm py-4"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <p>You&apos;re all caught up!</p>
                        <Icon
                          className="text-secondary-800"
                          icon={<LuPartyPopper />}
                        />
                      </div>
                    )
                  );
                }

                const item = items[virtualRow.index];
                return (
                  <ItemCard
                    key={item.id}
                    height={virtualRow.size}
                    startPos={virtualRow.start}
                    index={virtualRow.index}
                    item={item}
                    onLongPress={() => {
                      selectItems(
                        [item.slug],
                        virtualRow.index,
                        false,
                        false,
                        true,
                      );
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      const isCtrlPressed = e.ctrlKey || e.metaKey;
                      const isShiftPressed = e.shiftKey;
                      selectItems(
                        [item.slug],
                        virtualRow.index,
                        !isCtrlPressed && !isShiftPressed,
                        isShiftPressed,
                      );
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ItemList;
