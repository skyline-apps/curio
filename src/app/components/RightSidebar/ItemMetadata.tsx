import Thumbnail from "@app/components/Image/Thumbnail";
import ItemActions from "@app/components/Items/ItemActions";
import { useItemUpdate } from "@app/components/Items/ItemActions/actions";
import AdvancedActions from "@app/components/Items/ItemActions/AdvancedActions";
import OtherItemActions from "@app/components/Items/ItemActions/OtherItemActions";
import Labels from "@app/components/Labels";
import { useAppLayout } from "@app/providers/AppLayout";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import type { Item, PublicItem } from "@app/providers/Items";
import { useSettings } from "@app/providers/Settings";
import { useUser } from "@app/providers/User";
import { TextDirection } from "@app/schemas/db";
import { FALLBACK_HOSTNAME } from "@app/schemas/types";
import type { Label } from "@app/schemas/v1/user/labels";
import { cn } from "@app/utils/cn";
import { useCallback, useContext } from "react";
import { Link } from "react-router-dom";

interface ItemMetadataProps {
  item?: Item | PublicItem;
  readonly?: boolean;
}

interface ItemTitleProps {
  title: string;
  slug: string;
  anchor?: string;
}

export const ItemTitle: React.FC<ItemTitleProps> = ({
  title,
  slug,
  anchor,
}: ItemTitleProps) => {
  return (
    <div className="flex items-start justify-between">
      <Link
        className="hover:underline"
        to={`/item/${slug}${anchor ? `#${anchor}` : ""}`}
      >
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
    <p className="text-sm text-secondary-300 dark:text-secondary-600 line-clamp-6">
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
    <Link className="hover:underline" to={url} target="_blank">
      <p className="text-sm text-primary">Original page</p>
    </Link>
  ) : !url.startsWith(`https://${FALLBACK_HOSTNAME}`) ? (
    <Link className="hover:underline" to={url} target="_blank">
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
  const { user } = useUser();
  const { isEditable } = useContext(CurrentItemContext);
  const { labels, createLabel } = useSettings();
  const { addItemsLabel, removeItemsLabel } = useItemUpdate();
  const { navigateToRoot } = useAppLayout();

  const onItemActionSuccess = useCallback(() => {
    navigateToRoot();
  }, [navigateToRoot]);

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

      const labelToRemove = item.labels.find((l: Label) => l.id === labelId);
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
    <div
      className="flex flex-col h-full overflow-x-hidden overflow-y-auto"
      dir={metadata.textDirection}
    >
      <Thumbnail
        key={metadata.thumbnail}
        thumbnail={metadata.thumbnail ? metadata.thumbnail : undefined}
      />
      <div className="px-4 py-2">
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
              <div className="flex justify-between">
                <ItemActions
                  item={item}
                  showExpanded
                  onItemActionSuccess={onItemActionSuccess}
                />
                <AdvancedActions
                  item={item}
                  onItemActionSuccess={onItemActionSuccess}
                />
              </div>
            ) : null
          ) : user.id ? (
            <OtherItemActions item={item} />
          ) : null}
        </div>
        <ItemDescription description={metadata.description} />
        <div className="flex flex-col gap-2 py-2">
          {readonly ? (
            <Labels labels={item.labels || []} mode="view" />
          ) : isEditable(item) ? (
            <Labels
              availableLabels={labels || []}
              labels={item.labels || []}
              mode="picker"
              onAdd={handleAddLabel}
              onCreate={createLabel}
              onDelete={handleDeleteLabel}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ItemMetadata;
