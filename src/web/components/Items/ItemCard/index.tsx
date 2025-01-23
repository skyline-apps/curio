import Link from "next/link";

import type { ItemMetadata } from "@/providers/ItemsProvider";

interface ItemCardProps {
  item: ItemMetadata;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }: ItemCardProps) => {
  return (
    <div
      key={item.id}
      className="flex flex-row bg-background-400 px-4 py-1 h-16 rounded-sm hover:bg-background-300"
    >
      <div className="flex flex-col">
        <Link
          href={`/items/${item.slug}`}
          className="text-sm text-foreground hover:underline"
        >
          {item.title}
        </Link>
        <p className="text-xs text-secondary">{item.description}</p>
      </div>
    </div>
  );
};

export default ItemCard;
