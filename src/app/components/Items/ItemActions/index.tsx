import Button from "@app/components/ui/Button";
import { BrowserMessageContext } from "@app/providers/BrowserMessage";
import { Item, ItemsContext } from "@app/providers/Items";
import { useToast } from "@app/providers/Toast";
import { ItemState } from "@app/schemas/db";
import { cn } from "@app/utils/cn";
import { createLogger } from "@app/utils/logger";
import { useCallback, useContext } from "react";
import {
  HiArchiveBox,
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineStar,
  HiOutlineTrash,
  HiStar,
  HiTrash,
} from "react-icons/hi2";

import { useItemUpdate } from "./actions";

const log = createLogger("item-actions");

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
}
const ActionButton = <T,>({
  action,
  defaultDisplay,
  activeDisplay,
  isActive,
  isLoading,
}: ActionButtonProps<T>): React.ReactNode => {
  const { fetchItems } = useContext(ItemsContext);
  const { showToast } = useToast();

  const onPress = useCallback(async () => {
    await action()
      .then(async () => {
        await fetchItems(true);
      })
      .catch((error) => {
        log.error(error);
        showToast("Error updating item.");
      });
  }, [showToast, fetchItems, action]);

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
  showAdvanced?: boolean;
}

const ItemActions = ({
  item,
  showAdvanced,
  className,
}: ItemActionsProps): React.ReactElement => {
  const { updateItemsState, updateItemsFavorite, refetchItem } =
    useItemUpdate();
  const { savingItem } = useContext(BrowserMessageContext);

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
      />
      {showAdvanced && (
        <>
          <ActionButton
            action={async () => refetchItem(item)}
            defaultDisplay={{
              text: "Reload content",
              icon: <HiOutlineArrowPath />,
            }}
            isLoading={savingItem === item.url}
          />
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
          />
        </>
      )}
    </div>
  );
};

export default ItemActions;
