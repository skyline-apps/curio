import React, { useContext, useEffect } from "react";

import ItemCard from "@/components/Items/ItemCard";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";

interface ItemListProps {}

const ItemList: React.FC<ItemListProps> = () => {
  const { items } = useContext(ItemsContext);
  const { unselectItems } = useContext(CurrentItemContext);

  useEffect(() => {
    unselectItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ItemList;
