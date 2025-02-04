import { useCallback, useContext } from "react";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineStar,
} from "react-icons/hi2";

import Button from "@/components/ui/Button";
import { Dialog, showConfirm } from "@/components/ui/Modal/Dialog";
import { BrowserMessageContext } from "@/providers/BrowserMessageProvider";
import { ItemMetadata } from "@/providers/ItemsProvider";
import { createLogger } from "@/utils/logger";

const log = createLogger("item-actions");

interface ItemActionsProps {
  item?: ItemMetadata;
}

const ItemActions = ({ item }: ItemActionsProps): JSX.Element => {
  const { savingItem, saveItemContent } = useContext(BrowserMessageContext);

  const handleRefetch = useCallback(async () => {
    if (!item?.url) return;
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
  }, [item?.url, saveItemContent]);

  if (!item) {
    return <></>;
  }

  return (
    <div className="flex flex-row gap-2 my-2 justify-end flex-none">
      <Button
        isIconOnly
        variant="faded"
        size="sm"
        onPress={() => {
          /* TODO: Implement favorite */
        }}
      >
        <HiOutlineStar />
      </Button>
      <Button
        isIconOnly
        variant="faded"
        size="sm"
        onPress={() => {
          /* TODO: Implement archive */
        }}
      >
        <HiOutlineArchiveBox />
      </Button>
      <Button
        isIconOnly
        variant="faded"
        size="sm"
        onPress={handleRefetch}
        isLoading={savingItem}
      >
        <HiOutlineArrowPath />
      </Button>
      <Dialog />
    </div>
  );
};

export default ItemActions;
