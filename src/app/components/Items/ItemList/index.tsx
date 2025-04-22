import InfiniteList from "@app/components/InfiniteList";
import { ItemNavigationShortcuts } from "@app/components/Items/ItemList/ItemNavigationShortcuts";
import ItemsActions from "@app/components/Items/ItemList/ItemsActions";
import ItemSearch from "@app/components/Items/ItemList/ItemSearch";
import ItemRow from "@app/components/Items/ItemRow";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { ItemsContext } from "@app/providers/Items";
import React, { useContext } from "react";

type ItemListProps = Record<never, never>;

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
              selectItems([item.slug], index, {
                replace: false,
                selectRange: false,
                startSelecting: true,
              });
            }}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              const isCtrlPressed = e.ctrlKey || e.metaKey;
              const isShiftPressed = e.shiftKey;
              selectItems([item.slug], index, {
                replace: !isCtrlPressed && !isShiftPressed,
                selectRange: isShiftPressed,
              });
            }}
          />
        )}
      />
    </>
  );
};

export default ItemList;
