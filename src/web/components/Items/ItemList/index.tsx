"use client";
import React, { useContext } from "react";

import InfiniteList from "@/components/InfiniteList";
import { ItemNavigationShortcuts } from "@/components/Items/ItemList/ItemNavigationShortcuts";
import ItemsActions from "@/components/Items/ItemList/ItemsActions";
import ItemSearch from "@/components/Items/ItemList/ItemSearch";
import ItemRow from "@/components/Items/ItemRow";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";

interface ItemListProps {}

const ItemList: React.FC<ItemListProps> = ({}: ItemListProps) => {
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

  return (
    <>
      <ItemNavigationShortcuts />
      <div className="flex h-8 w-full items-center gap-2 mb-2">
        <ItemSearch itemCount={totalItems} />
        <ItemsActions />
      </div>

      <InfiniteList
        listData={items}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchItems}
        loadingError={loadingError}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        clearSelectedItems={clearSelectedItems}
        lastSelectionIndex={lastSelectionIndex}
        renderItem={(item, index) => (
          <ItemRow
            key={item.id}
            index={index}
            item={item}
            onLongPress={() => {
              selectItems([item.slug], index, false, false, true);
            }}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              const isCtrlPressed = e.ctrlKey || e.metaKey;
              const isShiftPressed = e.shiftKey;
              selectItems(
                [item.slug],
                index,
                !isCtrlPressed && !isShiftPressed,
                isShiftPressed,
              );
            }}
          />
        )}
      />
    </>
  );
};

export default ItemList;
