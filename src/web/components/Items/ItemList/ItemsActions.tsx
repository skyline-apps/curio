import Button from "@web/components/ui/Button";
import { ItemsContext } from "@web/providers/ItemsProvider";
import React, { useCallback, useContext } from "react";
import { HiOutlineArrowPath } from "react-icons/hi2";

const ItemsActions: React.FC = (): React.ReactElement => {
  const { fetchItems } = useContext(ItemsContext);

  const onPress = useCallback(() => {
    fetchItems(true);
  }, [fetchItems]);

  return (
    <div className="flex gap-2 hidden md:block">
      <Button
        size="sm"
        isIconOnly
        tooltip="Refresh items"
        variant="light"
        onPress={onPress}
      >
        <HiOutlineArrowPath />
      </Button>
    </div>
  );
};

export default ItemsActions;
