import Link from "next/link";
import { useContext } from "react";

import ItemActions from "@/components/RightSidebar/ItemActions";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import type { ItemMetadata } from "@/providers/ItemsProvider";
import { cn } from "@/utils/cn";

interface ItemCardProps {
  item: ItemMetadata;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }: ItemCardProps) => {
  const { currentItem, selectItems, selectedItems } =
    useContext(CurrentItemContext);
  const getHostname = (url: string): string =>
    new URL(url).hostname.replace(/www./, "");

  return (
    <div
      key={item.id}
      className={cn(
        "flex flex-row bg-background-400 pl-4 pr-1 py-1 pb-2 h-16 rounded-sm overflow-hidden hover:bg-background-300 group",
        currentItem?.id === item.id && "bg-background-300",
      )}
      onClick={() => selectItems([item.slug])}
      data-active={
        selectedItems.has(item.slug) || currentItem?.id === item.id
          ? true
          : undefined
      }
    >
      <div className="flex flex-row gap-2 justify-between items-start w-full">
        <div className="grow h-full block overflow-hidden">
          <div className="flex flex-row gap-2 items-center">
            <Link
              href={`/items/${item.slug}`}
              className="text-sm text-foreground hover:underline"
              onClick={(ev) => ev.stopPropagation()}
            >
              {item.metadata.title}
            </Link>
            <p className="text-xs text-secondary-600">
              {getHostname(item.url)}
            </p>
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
    </div>
  );
};

export default ItemCard;
