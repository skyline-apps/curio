"use client";
import React, { useContext, useEffect } from "react";

import ItemList from "@web/components/Items/ItemList";
import { ItemState } from "@web/db/schema";
import { ItemsContext } from "@web/providers/ItemsProvider";

const ArchivePage: React.FC = () => {
  const { fetchItems } = useContext(ItemsContext);

  useEffect(() => {
    fetchItems(true, { filters: { state: ItemState.ARCHIVED } });
    document.title = `Curio - Archive`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <ItemList />
    </div>
  );
};

export default ArchivePage;
