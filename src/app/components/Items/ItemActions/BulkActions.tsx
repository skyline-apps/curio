import Button from "@app/components/ui/Button";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { ItemsContext } from "@app/providers/Items";
import { ItemState } from "@app/schemas/db";
import { useCallback, useContext, useState } from "react";
import {
  HiArchiveBox,
  HiOutlineArchiveBox,
  HiOutlineTrash,
  HiTrash,
} from "react-icons/hi2";

import { useItemUpdate } from "./actions";

interface BulkActionButtonProps<T> {
  action: () => Promise<T>;
  text: string;
  icon: React.ReactNode;
  activeText?: string;
  activeIcon?: React.ReactNode;
  isActive?: boolean;
}

const BulkActionButton = <T,>({
  action,
  text,
  icon,
  activeText,
  activeIcon,
  isActive,
}: BulkActionButtonProps<T>): React.ReactNode => {
  const [pending, setPending] = useState<boolean>(false);

  const onPress = useCallback(async () => {
    setPending(true);
    await action().then(async () => {
      setPending(false);
    });
  }, [action]);

  return (
    <Button variant="faded" size="sm" onPress={onPress} isLoading={pending}>
      {isActive ? activeIcon || icon : icon}
      {isActive ? activeText || text : text}
    </Button>
  );
};

const BulkActions = (): React.ReactNode => {
  const { updateItemsState } = useItemUpdate();
  const { selectedItems, clearSelectedItems } = useContext(CurrentItemContext);
  const { items } = useContext(ItemsContext);

  const itemStates = (items || [])
    .filter((item) => selectedItems.has(item.slug))
    .map((item) => item.metadata.state);

  const allArchived = itemStates.every((state) => state === ItemState.ARCHIVED);
  const allDeleted = itemStates.every((state) => state === ItemState.DELETED);

  const itemsToUpdate = Array.from(selectedItems);

  return (
    <div className="flex flex-col gap-2 mx-4">
      <BulkActionButton
        action={() => {
          clearSelectedItems();
          return updateItemsState(
            itemsToUpdate,
            allArchived ? ItemState.ACTIVE : ItemState.ARCHIVED,
          );
        }}
        text="Archive all"
        icon={<HiOutlineArchiveBox />}
        activeText="Unarchive all"
        activeIcon={<HiArchiveBox />}
        isActive={allArchived}
      />
      <BulkActionButton
        action={() => {
          clearSelectedItems();
          return updateItemsState(
            itemsToUpdate,
            allDeleted ? ItemState.ACTIVE : ItemState.DELETED,
          );
        }}
        text="Delete all"
        icon={<HiOutlineTrash />}
        activeText="Restore all"
        activeIcon={<HiTrash />}
        isActive={allDeleted}
      />
    </div>
  );
};

export default BulkActions;
