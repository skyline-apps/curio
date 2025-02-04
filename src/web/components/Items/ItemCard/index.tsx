import Link from "next/link";
import { useContext } from "react";
import { HiCheck } from "react-icons/hi2";

import ItemActions from "@/components/RightSidebar/ItemActions";
import Icon from "@/components/ui/Icon";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import type { ItemMetadata } from "@/providers/ItemsProvider";
import { cn } from "@/utils/cn";

interface ItemCardProps {
  item: ItemMetadata;
  index: number;
  onClick?: (ev: React.MouseEvent) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  index,
  onClick,
}: ItemCardProps) => {
  const { currentItem, selectedItems, lastSelectionIndex } =
    useContext(CurrentItemContext);
  const getHostname = (url: string): string =>
    new URL(url).hostname.replace(/www./, "");

  return (
    <div
      key={item.id}
      className={cn(
        "group m-0.5 flex flex-row bg-background-400 pl-4 pr-1 py-1 pb-2 h-16 rounded-sm overflow-hidden hover:bg-background-300 data-[selected=true]:bg-background-300 data-[focus=true]:outline-focus data-[focus=true]:outline",
      )}
      onClick={onClick}
      data-selected={
        selectedItems.has(item.slug) || currentItem?.id === item.id
          ? true
          : undefined
      }
      data-focus={lastSelectionIndex === index && currentItem?.id !== item.id}
      data-active={currentItem?.id === item.id}
    >
      <div className="flex flex-row gap-2 justify-between items-start w-full">
        <div className="grow h-full block overflow-hidden">
          <div className="flex flex-row gap-2 items-center">
            <Link
              href={`/items/${item.slug}`}
              className="text-sm text-foreground hover:underline select-none"
              onClick={(ev) => ev.stopPropagation()}
            >
              {item.metadata.title}
            </Link>
            <p className="text-xs text-secondary-600 select-none">
              {getHostname(item.url)}
            </p>
          </div>
          <p className="text-xs text-secondary text-wrap select-none">
            {item.metadata.description}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <ItemActions
            item={item}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
          <Icon
            icon={<HiCheck />}
            className="opacity-0 group-data-[selected=true]:opacity-100 group-data-[active=true]:opacity-0 transition-opacity duration-200"
          />
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
