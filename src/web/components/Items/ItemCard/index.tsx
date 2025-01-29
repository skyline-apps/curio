import Link from "next/link";
import { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import type { ItemMetadata } from "@/providers/ItemsProvider";

interface ItemCardProps {
  item: ItemMetadata;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }: ItemCardProps) => {
  const { populateCurrentItem } = useContext(CurrentItemContext);

  return (
    <div
      key={item.id}
      className="flex flex-row bg-background-400 px-4 py-1 h-16 rounded-sm overflow-x-hidden hover:bg-background-300"
      onClick={() => populateCurrentItem({ item })}
    >
      <div className="block">
        <Link
          href={`/items/${item.slug}`}
          className="text-sm text-foreground hover:underline"
          onClick={(ev) => ev.stopPropagation()}
        >
          {item.metadata.title}
        </Link>
        <p className="text-xs text-secondary truncate">
          {item.metadata.description}
        </p>
      </div>
    </div>
  );
};

export default ItemCard;
