"use client";
import React, { useCallback, useContext, useEffect } from "react";

import ItemList from "@/components/Items/ItemList";
import { ItemState } from "@/db/schema";
import { ItemsContext } from "@/providers/ItemsProvider";

const ArchivePage: React.FC = () => {
  const { fetchItems } = useContext(ItemsContext);

  useEffect(() => {
    fetchItems(true, { filters: { state: ItemState.ARCHIVED } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    fetchItems(false, { filters: { state: ItemState.ARCHIVED } });
  }, [fetchItems]);

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <ItemList loadMore={loadMore} />
    </div>
  );
};

export default ArchivePage;
