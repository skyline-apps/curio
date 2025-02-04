import React, { useContext, useEffect } from "react";

import ItemCard from "@/components/Items/ItemCard";
import { ItemNavigation } from "@/components/Items/ItemNavigation";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";

interface ItemListProps {}

const ItemList: React.FC<ItemListProps> = () => {
  const { items } = useContext(ItemsContext);
  const { selectItems, clearSelectedItems } = useContext(CurrentItemContext);

  useEffect(() => {
    clearSelectedItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col">
      <ItemNavigation />
      {items.map((item, index) => (
        <ItemCard
          key={item.id}
          index={index}
          item={item}
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
      ))}
    </div>
  );
};

export default ItemList;
