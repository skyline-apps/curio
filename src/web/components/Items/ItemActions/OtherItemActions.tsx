import Button from "@web/components/ui/Button";
import { PublicItem } from "@web/providers/ItemsProvider";
import { cn } from "@web/utils/cn";
import { HiOutlineBookmark } from "react-icons/hi2";

import { useItemUpdate } from "./actions";

interface OtherItemActionsProps {
  item?: PublicItem;
}

const OtherItemActions = ({ item }: OtherItemActionsProps): JSX.Element => {
  const { saveExistingItems, isSavingExisting } = useItemUpdate();

  if (!item) {
    return <></>;
  }

  return (
    <div className={cn("flex flex-row gap-1")}>
      <Button
        size="sm"
        variant="faded"
        isLoading={isSavingExisting}
        tooltip="Add this item to your own inbox"
        onPress={() => {
          saveExistingItems([item.slug]);
        }}
      >
        <HiOutlineBookmark />
        Save to your library
      </Button>
    </div>
  );
};

export default OtherItemActions;
