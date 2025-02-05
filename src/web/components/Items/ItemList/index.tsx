import React, { useContext, useEffect, useRef } from "react";

import ItemCard from "@/components/Items/ItemCard";
import { ItemNavigation } from "@/components/Items/ItemNavigation";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";

interface ItemListProps {}

const ItemList: React.FC<ItemListProps> = () => {
  const { items } = useContext(ItemsContext);
  const { selectItems, clearSelectedItems } = useContext(CurrentItemContext);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearSelectedItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const rightSidebar = document.querySelector('[id="right-sidebar"]');
      if (rightSidebar?.contains(event.target as Node)) {
        return;
      }
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        clearSelectedItems();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clearSelectedItems]);

  return (
    <div ref={listRef} className="flex flex-col">
      <ItemNavigation />
      {items.map((item, index) => (
        <ItemCard
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
      ))}
    </div>
  );
};

export default ItemList;
