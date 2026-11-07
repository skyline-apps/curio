import { useOfflineArticle } from "@app/components/Items/useOfflineArticle";
import Button from "@app/components/ui/Button";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { Item } from "@app/providers/Items";
import { useToast } from "@app/providers/Toast";
import { ItemState } from "@app/schemas/db";
import { cn } from "@app/utils/cn";
import { useCallback, useContext } from "react";
import {
  HiArchiveBox,
  HiArrowDownCircle,
  HiOutlineArchiveBox,
  HiOutlineArrowDownCircle,
  HiOutlineShare,
  HiOutlineStar,
  HiOutlineTrash,
  HiStar,
  HiTrash,
} from "react-icons/hi2";

import { useItemUpdate } from "./actions";

interface ActionButtonDisplay {
  text: string;
  icon: React.ReactNode;
}

interface ActionButtonProps<T> {
  action: () => Promise<T>;
  defaultDisplay: ActionButtonDisplay;
  activeDisplay?: ActionButtonDisplay;
  isActive?: boolean;
  isLoading?: boolean;
  onActionSuccess?: () => void;
  "data-testid"?: string;
  variant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  activeVariant?:
    | "solid"
    | "bordered"
    | "light"
    | "flat"
    | "faded"
    | "shadow"
    | "ghost";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  activeColor?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  className?: string;
  activeClassName?: string;
}
const ActionButton = <T,>({
  action,
  defaultDisplay,
  activeDisplay,
  isActive,
  isLoading,
  onActionSuccess,
  "data-testid": dataTestId,
  variant = "faded",
  activeVariant,
  color,
  activeColor,
  className,
  activeClassName,
}: ActionButtonProps<T>): React.ReactNode => {
  const onPress = useCallback(async () => {
    try {
      await action();
      onActionSuccess?.();
    } catch {
      // Errors are handled/displayed by the action itself
    }
  }, [action, onActionSuccess]);

  const display = isActive ? activeDisplay || defaultDisplay : defaultDisplay;
  const currentVariant = isActive && activeVariant ? activeVariant : variant;
  const currentColor = isActive && activeColor ? activeColor : color;

  return (
    <Button
      isIconOnly
      variant={currentVariant}
      color={currentColor}
      size="sm"
      onPress={onPress}
      isLoading={isLoading}
      aria-label={display.text}
      tooltip={display.text}
      data-testid={dataTestId}
      data-active={isActive ? "true" : undefined}
      className={cn(className, isActive && activeClassName)}
    >
      {display.icon}
    </Button>
  );
};

interface ItemActionsProps {
  className?: string;
  item?: Item;
  showExpanded?: boolean;
  showOffline?: boolean;
  onItemActionSuccess?: () => void;
}

const ItemActions = ({
  item,
  showExpanded,
  showOffline = !showExpanded,
  className,
  onItemActionSuccess,
}: ItemActionsProps): React.ReactElement => {
  const { updateItemsState, updateItemsFavorite, shareItem } = useItemUpdate();
  const { clearSelectedItems } = useContext(CurrentItemContext);
  const { isSavedOffline, downloadArticleOffline, removeArticleOffline } =
    useOfflineArticle(item?.slug);
  const { showToast } = useToast();

  if (!item) {
    return <></>;
  }

  return (
    <div className={cn("flex flex-row gap-1", className)}>
      <ActionButton
        action={async () => {
          const isFav = !!item.metadata.isFavorite;
          await updateItemsFavorite([item.slug], !isFav);
          showToast(isFav ? "Removed from favorites" : "Added to favorites", {
            disappearing: true,
            action: {
              label: "Undo",
              onClick: async () => {
                await updateItemsFavorite([item.slug], isFav);
              },
            },
          });
        }}
        defaultDisplay={{ text: "Favorite", icon: <HiOutlineStar /> }}
        activeDisplay={{ text: "Unfavorite", icon: <HiStar /> }}
        isActive={item.metadata.isFavorite}
        data-testid="item-action-favorite"
      />
      <ActionButton
        action={async () => {
          clearSelectedItems();
          const isArchived = item.metadata.state === ItemState.ARCHIVED;
          const nextState = isArchived ? ItemState.ACTIVE : ItemState.ARCHIVED;
          const prevState = item.metadata.state;
          const res = await updateItemsState([item.slug], nextState);
          showToast(isArchived ? "Unarchived item" : "Archived item", {
            disappearing: true,
            action: {
              label: "Undo",
              onClick: async () => {
                await updateItemsState([item.slug], prevState);
              },
            },
          });
          return res;
        }}
        defaultDisplay={{ text: "Archive", icon: <HiOutlineArchiveBox /> }}
        activeDisplay={{ text: "Unarchive", icon: <HiArchiveBox /> }}
        isActive={item.metadata.state === ItemState.ARCHIVED}
        onActionSuccess={onItemActionSuccess}
        data-testid="item-action-archive"
      />
      {showOffline && (
        <ActionButton
          action={async () => {
            if (isSavedOffline) {
              removeArticleOffline(item.slug);
            } else {
              await downloadArticleOffline(item.slug);
            }
          }}
          defaultDisplay={{
            text: "Read offline",
            icon: <HiOutlineArrowDownCircle />,
          }}
          activeDisplay={{
            text: "Remove from offline",
            icon: <HiArrowDownCircle />,
          }}
          isActive={isSavedOffline}
          data-testid="item-action-read-offline"
        />
      )}
      {showExpanded && (
        <>
          <ActionButton
            action={async () => {
              clearSelectedItems();
              const isDeleted = item.metadata.state === ItemState.DELETED;
              const nextState = isDeleted
                ? ItemState.ACTIVE
                : ItemState.DELETED;
              const prevState = item.metadata.state;
              const res = await updateItemsState([item.slug], nextState);
              showToast(isDeleted ? "Restored item" : "Deleted item", {
                disappearing: true,
                action: {
                  label: "Undo",
                  onClick: async () => {
                    await updateItemsState([item.slug], prevState);
                  },
                },
              });
              return res;
            }}
            defaultDisplay={{ text: "Delete", icon: <HiOutlineTrash /> }}
            activeDisplay={{ text: "Restore", icon: <HiTrash /> }}
            isActive={item.metadata.state === ItemState.DELETED}
            onActionSuccess={onItemActionSuccess}
            data-testid="item-action-delete"
          />
          <ActionButton
            action={async () => shareItem(item)}
            defaultDisplay={{ text: "Share", icon: <HiOutlineShare /> }}
            data-testid="item-action-share"
          />
        </>
      )}
    </div>
  );
};

export default ItemActions;
