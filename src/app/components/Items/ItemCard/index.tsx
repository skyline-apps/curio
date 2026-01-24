import Thumbnail from "@app/components/Image/Thumbnail";
import Card from "@app/components/ui/Card";
import { type Item, type PublicItem } from "@app/providers/Items";
import { TextDirection } from "@app/schemas/db";
import { FALLBACK_HOSTNAME } from "@app/schemas/types";
import { cn } from "@app/utils/cn";
import { Link } from "react-router-dom";

interface ItemCardProps {
  item: PublicItem | Item;
  onPress?: () => void;
  hideThumbnail?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onPress,
  hideThumbnail,
}: ItemCardProps) => {
  // Keep card dimensions in sync with ItemGrid/index.tsx
  return (
    <Card
      className={cn(
        "flex-row items-start justify-center sm:items-center sm:justify-start sm:flex-col shrink-0 w-full sm:w-72 p-2 h-28",
        hideThumbnail ? "sm:h-48" : "sm:h-96",
      )}
      isPressable
      onPress={onPress}
      dir={item.metadata.textDirection}
    >
      {!hideThumbnail && (
        <Thumbnail
          key={item.metadata.thumbnail}
          thumbnail={
            item.metadata.thumbnail ? item.metadata.thumbnail : undefined
          }
          size="sm"
        />
      )}
      <div className="flex flex-col items-start text-left w-full p-1 overflow-hidden">
        <Link
          className="hover:underline"
          to={`/item/${item.slug}`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="overflow-hidden truncate">{item.metadata.title}</h2>
        </Link>
        {item.url === item.metadata.title ? (
          <Link
            className="hover:underline"
            to={item.url}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-primary">Original page</p>
          </Link>
        ) : item.url &&
          !item.url.startsWith(`https://${FALLBACK_HOSTNAME}/`) ? (
          <Link
            className="hover:underline w-full"
            to={item.url}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              dir="ltr"
              className={cn(
                "text-sm text-primary overflow-hidden truncate",
                item.metadata.textDirection === TextDirection.RTL &&
                  "text-right",
              )}
            >
              {item.url}
            </p>
          </Link>
        ) : null}
        {item.metadata.author || item.metadata.publishedAt ? (
          <div className="hidden sm:flex flex-col gap-2 py-1">
            <div className="flex flex-row gap-2 items-start">
              {item.metadata.author && (
                <p className="text-xs overflow-hidden truncate text-secondary-300 dark:text-secondary-600">
                  {item.metadata.author}
                </p>
              )}

              {item.metadata.publishedAt && (
                <p className="text-xs text-secondary-300 dark:text-secondary-600">
                  {new Date(item.metadata.publishedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ) : null}
        {item.metadata.description && (
          <p className="text-sm text-secondary line-clamp-2 sm:line-clamp-5">
            {item.metadata.description}
          </p>
        )}
      </div>
    </Card>
  );
};

export default ItemCard;
