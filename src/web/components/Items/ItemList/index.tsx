import React, { useContext } from "react";

import ItemCard from "@/components/Items/ItemCard";
import { ItemsContext } from "@/providers/ItemsProvider";

interface ItemListProps {}

const ItemList: React.FC<ItemListProps> = () => {
  const { items } = useContext(ItemsContext);
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ItemList;
