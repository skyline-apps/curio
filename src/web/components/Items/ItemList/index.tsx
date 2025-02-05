import { AnimatePresence, motion } from "framer-motion";
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
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={false}
            animate={{
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.1 },
            }}
          >
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ItemList;
