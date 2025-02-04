import Link from "next/link";
import { useContext } from "react";

import ItemActions from "@/components/RightSidebar/ItemActions";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import type { ItemMetadata } from "@/providers/ItemsProvider";
import { cn } from "@/utils/cn";

interface ItemCardProps {
  item: ItemMetadata;
  index: number;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, index }: ItemCardProps) => {
  const { currentItem, selectItems, selectedItems, lastSelectionIndex } =
    useContext(CurrentItemContext);
  const getHostname = (url: string): string =>
    new URL(url).hostname.replace(/www./, "");

  return (
    <div
      key={item.id}
      className={cn(
        "group m-0.5 flex flex-row bg-background-400 pl-4 pr-1 py-1 pb-2 h-16 rounded-sm overflow-hidden hover:bg-background-300 data-[selected=true]:bg-background-300 data-[active=true]:outline-focus data-[active=true]:outline",
      )}
      onClick={() => selectItems([item.slug], index)}
      data-selected={
        selectedItems.has(item.slug) || currentItem?.id === item.id
          ? true
          : undefined
      }
      data-active={lastSelectionIndex === index}
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
        <ItemActions item={item} className="invisible group-hover:visible" />
      </div>
    </div>
  );
};

export default ItemCard;
