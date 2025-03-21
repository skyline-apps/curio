import Link from "next/link";
import { useCallback, useContext } from "react";

import Thumbnail from "@/components/Image/Thumbnail";
import ItemActions from "@/components/Items/ItemActions";
import { useItemUpdate } from "@/components/Items/ItemActions/actions";
import OtherItemActions from "@/components/Items/ItemActions/OtherItemActions";
import Labels, { Label } from "@/components/Labels";
import { TextDirection } from "@/db/schema";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import type { Item, PublicItem } from "@/providers/ItemsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { UserContext } from "@/providers/UserProvider";
import { cn } from "@/utils/cn";
import { FALLBACK_HOSTNAME } from "@/utils/url";

interface ItemMetadataProps {
  item?: Item | PublicItem;
  readonly?: boolean;
}

interface ItemTitleProps {
  title: string;
  slug: string;
}

export const ItemTitle: React.FC<ItemTitleProps> = ({
  title,
  slug,
}: ItemTitleProps) => {
  return (
    <div className="flex items-start justify-between">
      <Link className="hover:underline" href={`/item/${slug}`}>
        <h2>{title}</h2>
      </Link>
    </div>
  );
};

interface ItemDescriptionProps {
  description?: string | null;
}

export const ItemDescription: React.FC<ItemDescriptionProps> = ({
  description,
}: ItemDescriptionProps) => {
  return description ? (
    <p className="text-sm text-secondary-300 dark:text-secondary-600">
      {description}
    </p>
  ) : null;
};

interface ItemUrlProps {
  title: string;
  textDirection?: TextDirection;
  url: string;
}

export const ItemUrl: React.FC<ItemUrlProps> = ({
  title,
  textDirection,
  url,
}: ItemUrlProps) => {
  return url === title ? (
    <Link className="hover:underline" href={url} target="_blank">
      <p className="text-sm text-primary">Original page</p>
    </Link>
  ) : !url.startsWith(`https://${FALLBACK_HOSTNAME}`) ? (
    <Link className="hover:underline" href={url} target="_blank">
      <p
        dir="ltr"
        className={cn(
          "text-sm text-primary overflow-hidden truncate",
          textDirection === TextDirection.RTL && "text-right",
        )}
      >
        {url}
      </p>
    </Link>
  ) : null;
};

const ItemMetadata: React.FC<ItemMetadataProps> = ({
  item,
  readonly,
}: ItemMetadataProps) => {
  const { user } = useContext(UserContext);
  const { isEditable } = useContext(CurrentItemContext);
  const { labels } = useSettings();
  const { addItemsLabel, removeItemsLabel } = useItemUpdate();

  const handleAddLabel = useCallback(
    async (label: Label): Promise<void> => {
      if (readonly || !item || !isEditable(item)) return;
      await addItemsLabel([item], label);
    },
    [item, isEditable, addItemsLabel, readonly],
  );

  const handleDeleteLabel = useCallback(
    async (labelId: string): Promise<void> => {
      if (readonly || !item || !isEditable(item) || !item.labels) return;

      const labelToRemove = item.labels.find((l) => l.id === labelId);
      if (labelToRemove) {
        await removeItemsLabel([item], labelToRemove);
      }
    },
    [item, isEditable, removeItemsLabel, readonly],
  );

  if (!item || !item.metadata) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-secondary">Select an item to view it here.</p>
      </div>
    );
  }
  const { metadata } = item;

  return (
    <div className="flex-1" dir={metadata.textDirection}>
      <Thumbnail
        key={metadata.thumbnail}
        thumbnail={metadata.thumbnail ? metadata.thumbnail : undefined}
      />
      <div className="px-4 py-2 overflow-x-hidden">
        <ItemTitle title={metadata.title} slug={item.slug} />
        <ItemUrl
          title={metadata.title}
          textDirection={metadata.textDirection}
          url={item.url}
        />
        <div className="flex flex-col gap-2 py-2">
          <div className="flex flex-row gap-2 items-start">
            {metadata.author && (
              <p className="text-xs overflow-hidden truncate text-secondary-300 dark:text-secondary-600">
                {metadata.author}
              </p>
            )}

            {metadata.publishedAt && (
              <p className="text-xs text-secondary-300 dark:text-secondary-600">
                {new Date(metadata.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {isEditable(item) ? (
            !readonly ? (
              <ItemActions item={item} showAdvanced />
            ) : null
          ) : user.id ? (
            <OtherItemActions item={item} />
          ) : null}
        </div>
        <ItemDescription description={metadata.description} />
        <div className="flex flex-col gap-2 py-2">
          {readonly ? (
            <Labels labels={item.labels || []} mode="view" />
          ) : (
            <Labels
              availableLabels={labels || []}
              labels={item.labels || []}
              mode="picker"
              onAdd={handleAddLabel}
              onDelete={handleDeleteLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemMetadata;
