import Link from "next/link";
import { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import type { ItemMetadata } from "@/providers/ItemsProvider";
import { cn } from "@/utils/cn";

interface ItemCardProps {
  item: ItemMetadata;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }: ItemCardProps) => {
  const { currentItem, selectItem } = useContext(CurrentItemContext);

  return (
    <div
      key={item.id}
      className={cn(
        "flex flex-row bg-background-400 px-4 py-1 h-16 rounded-sm overflow-x-hidden hover:bg-background-300",
        currentItem?.id === item.id && "bg-background-300",
      )}
      onClick={() => selectItem(item.slug)}
    >
      <div className="block overflow-hidden">
        <Link
          href={`/items/${item.slug}`}
          className="text-sm text-foreground hover:underline"
          onClick={(ev) => ev.stopPropagation()}
        >
          {item.metadata.title}
        </Link>
        <p className="text-xs text-secondary text-wrap">
          {item.metadata.description}
        </p>
      </div>
    </div>
  );
};

export default ItemCard;
