import Link from "next/link";

import Thumbnail from "@/components/Image/Thumbnail";
import Card from "@/components/ui/Card";
import { type PublicItem } from "@/providers/ItemsProvider";

interface ItemCardProps {
  item: PublicItem;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }: ItemCardProps) => {
  return (
    <Card className="w-80 h-96">
      <Thumbnail
        key={item.metadata.thumbnail}
        thumbnail={
          item.metadata.thumbnail ? item.metadata.thumbnail : undefined
        }
      />
      <div className="px-2 py-1 overflow-hidden">
        <Link className="hover:underline" href={`/item/${item.slug}`}>
          <h2 className="overflow-hidden truncate">{item.metadata.title}</h2>
        </Link>
        {item.url === item.metadata.title ? (
          <Link className="hover:underline" href={item.url} target="_blank">
            <p className="text-sm text-primary">Original page</p>
          </Link>
        ) : (
          <Link className="hover:underline" href={item.url} target="_blank">
            <p className="text-sm text-primary overflow-hidden truncate">
              {item.url}
            </p>
          </Link>
        )}
        <div className="flex flex-col gap-2 py-2">
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
        {item.metadata.description && (
          <p className="text-sm text-secondary max-h-20 overflow-hidden">
            {item.metadata.description}
          </p>
        )}
      </div>
    </Card>
  );
};

export default ItemCard;
