import React, { useContext, useEffect, useState } from "react";

import ItemCard from "@/components/Items/ItemCard";
import { Listbox, ListboxItem } from "@/components/ui/Listbox";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";

interface ItemListProps {}

const ItemList: React.FC<ItemListProps> = () => {
  const { items } = useContext(ItemsContext);
  const { selectedItems, selectItems, unselectItems } =
    useContext(CurrentItemContext);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    unselectItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectionChange = (keys: Selection): void => {
    selectItems(Array.from(keys) as string[]);
  };

  return (
    <Listbox
      variant="light"
      aria-label="Item list"
      selectedKeys={new Set(selectedItems)}
      onSelectionChange={handleSelectionChange}
      selectionMode="multiple"
      autoFocus="first"
      hideSelectedIcon
      hideEmptyContent
      isVirtualized
      virtualization={{
        maxListboxHeight: windowHeight - 100,
        itemHeight: 63,
      }}
      classNames={{ base: "overflow-hidden p-0" }}
    >
      {items.map((item) => (
        <ListboxItem
          key={item.slug}
          classNames={{
            base: "h-[63px] flex items-start border-2 border-background p-2 bg-background-400 rounded-sm overflow-hidden hover:bg-background-300 group data-[selected=true]:bg-background-300 data-[focus=true]:outline-none data-[focus-visible=true]:outline-none",
          }}
          shouldHighlightOnFocus
          textValue={item.metadata.title}
        >
          <ItemCard item={item} />
        </ListboxItem>
      ))}
    </Listbox>
  );
};

export default ItemList;
