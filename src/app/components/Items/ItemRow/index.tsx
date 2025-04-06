import Favicon from "@app/components/Image/Favicon";
import ItemActions from "@app/components/Items/ItemActions";
import Labels from "@app/components/Labels";
import Markdown from "@app/components/Markdown";
import Icon from "@app/components/ui/Icon";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { type Item, ItemsContext } from "@app/providers/Items";
import { ItemSource } from "@web/db/schema";
import { FALLBACK_HOSTNAME } from "@web/utils/url";
import { Link } from "react-router-dom";
import { useContext, useRef } from "react";
import { HiCheck, HiOutlineEnvelope } from "react-icons/hi2";

interface ItemRowProps {
  item: Item;
  index: number;
  onClick?: (ev: React.MouseEvent) => void;
  onLongPress?: (ev: React.TouchEvent) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  onClick,
  onLongPress,
}: ItemRowProps) => {
  const { searchQuery } = useContext(ItemsContext);
  const { currentItem, selectedItems, lastSelectionIndex } =
    useContext(CurrentItemContext);
  const getHostname = (url: string): string =>
    new URL(url).hostname
      .replace(/www./, "")
      .replace(FALLBACK_HOSTNAME, "newsletter");
  const timer = useRef<number | null>(null);

  const isRead = item.metadata.lastReadAt !== null;

  return (
    <div
      key={item.id}
      dir={item.metadata.textDirection}
      className="w-full group flex flex-row bg-background-400 pl-4 pr-1 py-1 h-16 rounded-sm overflow-hidden hover:bg-background-300 data-[selected=true]:bg-background-300 data-[focus=true]:outline-focus data-[focus=true]:outline"
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
      data-focus={
        (lastSelectionIndex === index && currentItem?.id !== item.id) ||
        (selectedItems.size === 1 && selectedItems.has(item.slug))
      }
      data-active={currentItem?.id === item.id}
    >
      <div className="flex flex-row gap-2 justify-between items-start w-full">
        <div className="grow h-full block overflow-hidden">
          <div className="flex flex-row gap-2 items-center h-6">
            <div className="flex shrink-0 items-center justify-center w-4 h-4">
              {item.metadata.source === ItemSource.EMAIL ? (
                <Icon icon={<HiOutlineEnvelope />} />
              ) : (
                <Favicon
                  className={isRead ? "opacity-50" : ""}
                  url={item.metadata.favicon}
                />
              )}
            </div>
            <Link
              to={`/item/${item.slug}`}
              className="text-sm shrink-0 text-foreground hover:underline truncate"
            >
              {isRead ? (
                <div className="text-secondary-600">{item.metadata.title}</div>
              ) : (
                <div className="font-medium">{item.metadata.title}</div>
              )}
            </Link>
            <p className="text-xs text-secondary-700 hidden md:block">
              {getHostname(item.url)}
            </p>
            {item.labels && item.labels.length > 0 && (
              <div className="hidden md:block max-h-6 overflow-hidden">
                <Labels mode="view" labels={item.labels} truncate />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {item.excerpt && searchQuery ? (
              <Markdown
                className="[&_*]:text-secondary-700 [&_*]:text-xs [&_*]:my-0 text-wrap truncate"
                components={{
                  strong: ({ children }) => (
                    <strong className="!text-foreground">{children}</strong>
                  ),
                }}
              >
                {item.excerpt}
              </Markdown>
            ) : (
              <p className="text-xs text-secondary-700 text-wrap truncate">
                {item.metadata.description}
              </p>
            )}
          </div>
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

export default ItemRow;
