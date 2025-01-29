import Link from "next/link";

import type { ItemContent } from "@/providers/CurrentItemProvider";

interface ItemMetadataProps {
  item?: ItemContent["item"];
}

const ItemMetadata: React.FC<ItemMetadataProps> = ({
  item,
}: ItemMetadataProps) => {
  if (!item || !item.metadata) return null;
  const { metadata } = item;

  return (
    <>
      {metadata.thumbnail && (
        <div className="w-full h-48 p-2">
          <img
            alt="item thumbnail"
            className="object-contain w-full h-full"
            src={metadata.thumbnail}
          />
        </div>
      )}
      <div className="p-4">
        <Link className="hover:underline" href={`/items/${item.slug}`}>
          <h2>{metadata.title}</h2>
        </Link>
        <div className="flex flex-row justify-between gap-2 text-sm text-secondary-300 dark:text-secondary-600">
          {metadata.author && <p>{metadata.author}</p>}
          {metadata.publishedAt && (
            <p>{new Date(metadata.publishedAt).toLocaleDateString()}</p>
          )}
        </div>
        {metadata.description && (
          <p className="text-sm text-secondary">{metadata.description}</p>
        )}
      </div>
    </>
  );
};

export default ItemMetadata;
