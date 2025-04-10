import ItemList from "@app/components/Items/ItemList";
import { ItemsContext } from "@app/providers/Items";
import { ItemState } from "@app/schemas/db";
import React, { useContext, useEffect } from "react";

const InboxPage: React.FC = () => {
  const { fetchItems } = useContext(ItemsContext);

  useEffect(() => {
    fetchItems(true, { filters: { state: ItemState.ACTIVE } });
    document.title = `Curio - Inbox`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <ItemList />
    </div>
  );
};

export default InboxPage;
