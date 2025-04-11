import Button from "@app/components/ui/Button";
import { Item } from "@app/providers/Items";
import { ItemSource } from "@app/schemas/db";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import React from "react";
import { HiEllipsisVertical } from "react-icons/hi2";

import { useItemUpdate } from "./actions";

interface AdvancedActionsProps {
  item: Item;
}

export const AdvancedActions: React.FC<AdvancedActionsProps> = ({ item }) => {
  const { markUnread, markRead, refetchItem } = useItemUpdate();

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button isIconOnly size="sm" aria-label="More actions" variant="ghost">
          <HiEllipsisVertical className="h-5 w-5" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu className="w-48">
        {!!item.metadata.lastReadAt ? (
          <DropdownItem key="mark-unread" onPress={() => markUnread(item)}>
            Mark as unread
          </DropdownItem>
        ) : (
          <DropdownItem key="mark-read" onPress={() => markRead(item)}>
            Mark as read
          </DropdownItem>
        )}
        {item.metadata.source !== ItemSource.EMAIL ? (
          <DropdownItem key="refetch" onPress={() => refetchItem(item)}>
            Refetch item
          </DropdownItem>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  );
};

export default AdvancedActions;
