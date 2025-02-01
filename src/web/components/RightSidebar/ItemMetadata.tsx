import Link from "next/link";
import { useCallback, useContext } from "react";

import Button from "@/components/ui/Button";
import { BrowserMessageContext } from "@/providers/BrowserMessageProvider";
import type { ItemContent } from "@/providers/CurrentItemProvider";
import { createLogger } from "@/utils/logger";

const log = createLogger("item-metadata");

interface ItemMetadataProps {
  item?: ItemContent["item"];
}

const ItemMetadata: React.FC<ItemMetadataProps> = ({
  item,
}: ItemMetadataProps) => {
  const { savingItem, saveItemContent } = useContext(BrowserMessageContext);

  const handleRefetch = useCallback(async () => {
    if (!item?.url) return;

    try {
      await saveItemContent(item.url);
    } catch (error) {
      log.error("Error refetching content:", error);
    }
  }, [item?.url, saveItemContent]);

  if (!item || !item.metadata) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-secondary">Select an item to view it here.</p>
      </div>
    );
  }
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
      <div className="px-4 py-2 overflow-x-hidden">
        <div className="flex items-start justify-between">
          <Link className="hover:underline" href={`/items/${item.slug}`}>
            <h2>{metadata.title}</h2>
          </Link>
        </div>
        {item.url === metadata.title ? (
          <Link className="hover:underline" href={item.url} target="_blank">
            <p className="text-sm text-secondary">Original page</p>
          </Link>
        ) : (
          <Link className="hover:underline" href={item.url}>
            <p className="text-sm text-primary">{item.url}</p>
          </Link>
        )}
        <div className="flex flex-row justify-between gap-2 text-sm text-secondary-300 dark:text-secondary-600">
          {metadata.author && <p>{metadata.author}</p>}
          {metadata.publishedAt && (
            <p>{new Date(metadata.publishedAt).toLocaleDateString()}</p>
          )}
        </div>
        {metadata.description && (
          <p className="text-sm text-secondary">{metadata.description}</p>
        )}
        <Button size="sm" onPress={handleRefetch} isLoading={savingItem}>
          Refetch
        </Button>
      </div>
    </>
  );
};

export default ItemMetadata;
