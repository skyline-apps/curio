import Link from "next/link";

import type { ItemContent } from "@/providers/CurrentItemProvider";

import ItemActions from "./ItemActions";

interface ItemMetadataProps {
  item?: ItemContent["item"];
}

const ItemMetadata: React.FC<ItemMetadataProps> = ({
  item,
}: ItemMetadataProps) => {
  if (!item || !item.metadata) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-secondary">Select an item to view it here.</p>
      </div>
    );
  }
  const { metadata } = item;

  return (
    <div className="flex-1">
      {metadata.thumbnail && (
        <div className="w-full h-48 p-2">
          <img
            alt="item thumbnail"
            className="object-contain w-full h-full"
            src={metadata.thumbnail}
          />
        </div>
      )}
      <div className="px-4 py-2 overflow-x-hidden">
        <div className="flex items-start justify-between">
          <Link className="hover:underline" href={`/items/${item.slug}`}>
            <h2>{metadata.title}</h2>
          </Link>
        </div>
        {item.url === metadata.title ? (
          <Link className="hover:underline" href={item.url} target="_blank">
            <p className="text-sm text-primary">Original page</p>
          </Link>
        ) : (
          <Link className="hover:underline" href={item.url}>
            <p className="text-sm text-primary overflow-hidden text-ellipsis truncate">
              {item.url}
            </p>
          </Link>
        )}
        <div className="flex flex-row gap-2 justify-between items-start">
          <div className="flex flex-col flex-1 min-w-24 py-2">
            {metadata.author && (
              <p className="text-xs overflow-hidden text-ellipsis truncate text-secondary-300 dark:text-secondary-600">
                {metadata.author}
              </p>
            )}

            {metadata.publishedAt && (
              <p className="text-xs text-secondary-300 dark:text-secondary-600">
                {new Date(metadata.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <ItemActions item={item} />
        </div>
        {metadata.description && (
          <p className="text-sm text-secondary">{metadata.description}</p>
        )}
      </div>
    </div>
  );
};

export default ItemMetadata;
