import Link from "next/link";
import { useContext, useRef } from "react";
import { HiCheck } from "react-icons/hi2";

import Favicon from "@/components/Image/Favicon";
import ItemActions from "@/components/Items/ItemActions";
import Icon from "@/components/ui/Icon";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import type { ItemMetadata } from "@/providers/ItemsProvider";
import { cn } from "@/utils/cn";

interface ItemCardProps {
  height?: number;
  startPos?: number;
  item: ItemMetadata;
  index: number;
  onClick?: (ev: React.MouseEvent) => void;
  onLongPress?: (ev: React.TouchEvent) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  height,
  startPos,
  item,
  index,
  onClick,
  onLongPress,
}: ItemCardProps) => {
  const { currentItem, selectedItems, lastSelectionIndex } =
    useContext(CurrentItemContext);
  const getHostname = (url: string): string =>
    new URL(url).hostname.replace(/www./, "");
  const timer = useRef<number | null>(null);

  const isRead = item.metadata.lastReadAt !== null;

  return (
    <div
      key={item.id}
      className={cn(
        "w-full group flex flex-row bg-background-400 pl-4 pr-1 py-1 pb-2 h-16 rounded-sm overflow-hidden hover:bg-background-300 data-[selected=true]:bg-background-300 data-[focus=true]:outline-focus data-[focus=true]:outline",
        startPos !== undefined && "absolute top-0 left-0",
      )}
      style={{
        ...(height && { height: `${height}px` }),
        ...(startPos !== undefined && {
          transform: `translateY(${startPos}px)`,
        }),
      }}
      onClick={onClick}
      onTouchStart={(e: React.TouchEvent) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          onLongPress?.(e);
        }, 500);
      }}
      onTouchEnd={() => {
        if (timer.current) clearTimeout(timer.current);
      }}
      onTouchMove={() => {
        if (timer.current) clearTimeout(timer.current);
      }}
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
            <div className="flex shrink-0 items-center justify-center w-4 h-4">
              <Favicon
                className={isRead ? "opacity-50" : ""}
                url={item.metadata.favicon}
              />
            </div>
            <Link
              href={`/items/${item.slug}`}
              className="text-sm text-foreground hover:underline truncate select-none"
              onClick={(ev) => ev.stopPropagation()}
            >
              {isRead ? (
                <div className="text-secondary-600">{item.metadata.title}</div>
              ) : (
                <div className="font-medium">{item.metadata.title}</div>
              )}
            </Link>
            <p className="text-xs text-secondary-700 select-none hidden md:block">
              {getHostname(item.url)}
            </p>
          </div>
          <p className="text-xs text-secondary-700 text-wrap truncate select-none">
            {item.metadata.description}
          </p>
        </div>
        <ItemActions
          item={item}
          className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>
      <Icon
        icon={<HiCheck />}
        className="absolute bottom-2 right-2 opacity-0 group-data-[selected=true]:group-data-[active=false]:opacity-100 transition-opacity duration-200 bg-background-400"
      />
    </div>
  );
};

export default ItemCard;
