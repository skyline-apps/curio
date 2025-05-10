import Button from "@app/components/ui/Button";
import { Item, ItemsContext } from "@app/providers/Items";
import { ItemState } from "@app/schemas/db";
import { cn } from "@app/utils/cn";
import { useCallback, useContext } from "react";
import {
  HiArchiveBox,
  HiOutlineArchiveBox,
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
}
const ActionButton = <T,>({
  action,
  defaultDisplay,
  activeDisplay,
  isActive,
  isLoading,
  onActionSuccess,
}: ActionButtonProps<T>): React.ReactNode => {
  const { fetchItems } = useContext(ItemsContext);

  const onPress = useCallback(async () => {
    await action().then(async () => {
      onActionSuccess?.();
      await fetchItems(true);
    });
  }, [fetchItems, action, onActionSuccess]);

  return (
    <Button
      isIconOnly
      variant="faded"
      size="sm"
      onPress={onPress}
      isLoading={isLoading}
      tooltip={
        isActive ? (activeDisplay || defaultDisplay).text : defaultDisplay.text
      }
    >
      {isActive ? (activeDisplay || defaultDisplay).icon : defaultDisplay.icon}
    </Button>
  );
};

interface ItemActionsProps {
  className?: string;
  item?: Item;
  showExpanded?: boolean;
  onItemActionSuccess?: () => void;
}

const ItemActions = ({
  item,
  showExpanded,
  className,
  onItemActionSuccess,
}: ItemActionsProps): React.ReactElement => {
  const { updateItemsState, updateItemsFavorite, shareItem } = useItemUpdate();

  if (!item) {
    return <></>;
  }

  return (
    <div className={cn("flex flex-row gap-1", className)}>
      <ActionButton
        action={async () =>
          updateItemsFavorite([item.slug], !item.metadata.isFavorite)
        }
        defaultDisplay={{ text: "Favorite", icon: <HiOutlineStar /> }}
        activeDisplay={{ text: "Unfavorite", icon: <HiStar /> }}
        isActive={item.metadata.isFavorite}
      />
      <ActionButton
        action={async () =>
          updateItemsState(
            [item.slug],
            item.metadata.state === ItemState.ARCHIVED
              ? ItemState.ACTIVE
              : ItemState.ARCHIVED,
          )
        }
        defaultDisplay={{ text: "Archive", icon: <HiOutlineArchiveBox /> }}
        activeDisplay={{ text: "Unarchive", icon: <HiArchiveBox /> }}
        isActive={item.metadata.state === ItemState.ARCHIVED}
        onActionSuccess={onItemActionSuccess}
      />
      {showExpanded && (
        <>
          <ActionButton
            action={async () =>
              updateItemsState(
                [item.slug],
                item.metadata.state === ItemState.DELETED
                  ? ItemState.ACTIVE
                  : ItemState.DELETED,
              )
            }
            defaultDisplay={{ text: "Delete", icon: <HiOutlineTrash /> }}
            activeDisplay={{ text: "Restore", icon: <HiTrash /> }}
            isActive={item.metadata.state === ItemState.DELETED}
            onActionSuccess={onItemActionSuccess}
          />
          <ActionButton
            action={async () => shareItem(item)}
            defaultDisplay={{ text: "Share", icon: <HiOutlineShare /> }}
          />
        </>
      )}
    </div>
  );
};

export default ItemActions;
