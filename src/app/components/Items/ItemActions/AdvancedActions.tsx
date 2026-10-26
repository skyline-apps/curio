import { useOfflineArticle } from "@app/components/Items/useOfflineArticle";
import Button from "@app/components/ui/Button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@app/components/ui/Dropdown";
import { Item } from "@app/providers/Items";
import { ItemSource } from "@app/schemas/db";
import React from "react";
import { HiEllipsisVertical } from "react-icons/hi2";

import { useItemUpdate } from "./actions";

interface AdvancedActionsProps {
  item: Item;
  onItemActionSuccess?: () => void;
}

export const AdvancedActions: React.FC<AdvancedActionsProps> = ({
  item,
  onItemActionSuccess,
}) => {
  const { markUnread, markRead, refetchItem } = useItemUpdate();
  const { isSavedOffline, downloadArticleOffline, removeArticleOffline } =
    useOfflineArticle(item.slug);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" aria-label="More actions" variant="ghost">
          <HiEllipsisVertical className="h-5 w-5" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu className="w-48">
        {!!item.metadata.lastReadAt ? (
          <DropdownItem
            key="mark-unread"
            onPress={() => markUnread(item).then(() => onItemActionSuccess?.())}
          >
            Mark as unread
          </DropdownItem>
        ) : (
          <DropdownItem key="mark-read" onPress={() => markRead(item)}>
            Mark as read
          </DropdownItem>
        )}
        {isSavedOffline ? (
          <DropdownItem
            key="remove-offline"
            onPress={() => {
              removeArticleOffline(item.slug);
              onItemActionSuccess?.();
            }}
          >
            Remove from offline
          </DropdownItem>
        ) : (
          <DropdownItem
            key="read-offline"
            onPress={async () => {
              try {
                await downloadArticleOffline(item.slug);
                onItemActionSuccess?.();
              } catch {
                // Toast and logging handled in downloadArticleOffline
              }
            }}
          >
            Read offline
          </DropdownItem>
        )}
        {item.metadata.source !== ItemSource.EMAIL ? (
          <DropdownItem key="refetch" onPress={() => refetchItem(item)}>
            Refetch item
          </DropdownItem>
        ) : null}
        {item.metadata.source !== ItemSource.EMAIL ? (
          <DropdownItem
            key="public-fetch"
            onPress={() => refetchItem(item, true)}
          >
            Fetch from public archive
          </DropdownItem>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  );
};

export default AdvancedActions;
