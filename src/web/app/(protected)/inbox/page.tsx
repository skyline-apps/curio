"use client";
import ItemList from "@web/components/Items/ItemList";
import { ItemState } from "@web/db/schema";
import { ItemsContext } from "@web/providers/ItemsProvider";
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
