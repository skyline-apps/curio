"use client";
import InfiniteList from "@web/components/InfiniteList";
import { ItemNavigationShortcuts } from "@web/components/Items/ItemList/ItemNavigationShortcuts";
import ItemsActions from "@web/components/Items/ItemList/ItemsActions";
import ItemSearch from "@web/components/Items/ItemList/ItemSearch";
import ItemRow from "@web/components/Items/ItemRow";
import { CurrentItemContext } from "@web/providers/CurrentItemProvider";
import { ItemsContext } from "@web/providers/ItemsProvider";
import React, { useContext } from "react";

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
