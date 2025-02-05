import { useCallback, useContext, useState } from "react";
import {
  HiArchiveBox,
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineStar,
  HiOutlineTrash,
  HiStar,
  HiTrash,
} from "react-icons/hi2";

import Button from "@/components/ui/Button";
import { Dialog, showConfirm } from "@/components/ui/Modal/Dialog";
import { ItemState } from "@/db/schema";
import { BrowserMessageContext } from "@/providers/BrowserMessageProvider";
import { ItemMetadata, ItemsContext } from "@/providers/ItemsProvider";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/utils/cn";
import { createLogger } from "@/utils/logger";

import { updateItemsFavorite, updateItemsState } from "./actions";

const log = createLogger("item-actions");

interface ActionButtonProps<T> {
  action: () => Promise<T>;
  icon: React.ReactNode;
  errorMessage: string;
  activeIcon?: React.ReactNode;
  isActive?: boolean;
  isLoading?: boolean;
}
const ActionButton = <T,>({
  action,
  icon,
  errorMessage,
  activeIcon,
  isActive,
  isLoading,
}: ActionButtonProps<T>): React.ReactNode => {
  const { fetchItems } = useContext(ItemsContext);
  const [pending, setPending] = useState<boolean>(false);
  const { showToast } = useToast();

  // TODO: Clear selection in certain cases after action
  const onPress = useCallback(async () => {
    setPending(true);
    await action()
      .then(async () => {
        await fetchItems({}, true);
        setPending(false);
      })
      .catch((error) => {
        log.error(error);
        showToast(errorMessage);
      });
  }, [errorMessage, showToast, fetchItems, action]);

  const status = pending ? !isActive : isActive;

  return (
    <Button
      isIconOnly
      variant="faded"
      size="sm"
      onPress={onPress}
      isLoading={isLoading}
    >
      {status ? activeIcon : icon}
    </Button>
  );
};

interface ItemActionsProps {
  className?: string;
  item?: ItemMetadata;
  showAdvanced?: boolean;
}

const ItemActions = ({
  item,
  showAdvanced,
  className,
}: ItemActionsProps): JSX.Element => {
  const { savingItem, saveItemContent } = useContext(BrowserMessageContext);

  const handleRefetch = useCallback(async () => {
    if (!item?.url) return;
    if (item.metadata.versionName) {
      showConfirm(
        "Are you sure you want to refresh this item? This will erase any notes, highlights, and reading progress.",
        async () => {
          try {
            await saveItemContent(item.url);
          } catch (error) {
            log.error("Error refreshing content:", error);
          }
        },
        "Refresh",
      );
    } else {
      try {
        await saveItemContent(item.url);
      } catch (error) {
        log.error("Error refreshing content:", error);
      }
    }
  }, [item?.url, item?.metadata.versionName, saveItemContent]);

  if (!item) {
    return <></>;
  }

  return (
    <div className={cn("flex flex-row gap-1", className)}>
      <ActionButton
        action={() =>
          updateItemsFavorite([item.slug], !item.metadata.isFavorite)
        }
        icon={<HiOutlineStar />}
        activeIcon={<HiStar />}
        isActive={item.metadata.isFavorite}
        errorMessage="Error favoriting item"
      />
      <ActionButton
        action={() =>
          updateItemsState(
            [item.slug],
            item.metadata.state === ItemState.ARCHIVED
              ? ItemState.ACTIVE
              : ItemState.ARCHIVED,
          )
        }
        icon={<HiOutlineArchiveBox />}
        activeIcon={<HiArchiveBox />}
        isActive={item.metadata.state === ItemState.ARCHIVED}
        errorMessage="Error archiving item"
      />
      {showAdvanced && (
        <>
          <ActionButton
            action={handleRefetch}
            icon={<HiOutlineArrowPath />}
            isLoading={savingItem}
            errorMessage="Error reloading item"
          />
          <ActionButton
            action={() =>
              updateItemsState(
                [item.slug],
                item.metadata.state === ItemState.DELETED
                  ? ItemState.ACTIVE
                  : ItemState.DELETED,
              )
            }
            icon={<HiOutlineTrash />}
            activeIcon={<HiTrash />}
            isActive={item.metadata.state === ItemState.DELETED}
            errorMessage="Error deleting item"
          />
        </>
      )}
      <Dialog />
    </div>
  );
};

export default ItemActions;
