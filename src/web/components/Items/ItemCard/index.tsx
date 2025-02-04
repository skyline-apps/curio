import Link from "next/link";

import ItemActions from "@/components/RightSidebar/ItemActions";
import type { ItemMetadata } from "@/providers/ItemsProvider";

interface ItemCardProps {
  item: ItemMetadata;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }: ItemCardProps) => {
  const getHostname = (url: string): string =>
    new URL(url).hostname.replace(/www./, "");

  return (
    <div className="flex flex-row gap-2 justify-between items-start w-full pb-1">
      <div className="grow h-full block overflow-hidden">
        <div className="flex flex-row gap-2 items-center">
          <Link
            href={`/items/${item.slug}`}
            className="text-sm text-foreground hover:underline"
            onClick={(ev) => ev.stopPropagation()}
          >
            {item.metadata.title}
          </Link>
          <p className="text-xs text-secondary-600">{getHostname(item.url)}</p>
        </div>
        <p className="text-xs text-secondary text-wrap">
          {item.metadata.description}
        </p>
      </div>
      <ItemActions
        item={item}
        className="invisible group-hover:visible group-data-[active=true]:visible"
      />
    </div>
  );
};

export default ItemCard;
