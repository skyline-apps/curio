import { useCallback, useContext } from "react";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineStar,
  HiOutlineTrash,
} from "react-icons/hi2";

import Button from "@/components/ui/Button";
import { Dialog, showConfirm } from "@/components/ui/Modal/Dialog";
import { BrowserMessageContext } from "@/providers/BrowserMessageProvider";
import { ItemMetadata } from "@/providers/ItemsProvider";
import { cn } from "@/utils/cn";
import { createLogger } from "@/utils/logger";

const log = createLogger("item-actions");

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
    <div className={cn("flex flex-row gap-2 flex-none", className)}>
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
      {showAdvanced && (
        <>
          <Button
            isIconOnly
            variant="faded"
            size="sm"
            onPress={handleRefetch}
            isLoading={savingItem}
          >
            <HiOutlineArrowPath />
          </Button>
          <Button
            isIconOnly
            variant="faded"
            size="sm"
            onPress={() => {} /* TODO: Implement delete */}
            isLoading={savingItem}
          >
            <HiOutlineTrash />
          </Button>
        </>
      )}
      <Dialog />
    </div>
  );
};

export default ItemActions;
