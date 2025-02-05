"use client";
import React, { useCallback, useContext, useEffect } from "react";

import InfiniteItemList from "@/components/Items/ItemList/InfiniteItemList";
import { ItemState } from "@/db/schema";
import { ItemsContext } from "@/providers/ItemsProvider";

const HomePage: React.FC = () => {
  const { fetchItems } = useContext(ItemsContext);

  useEffect(() => {
    fetchItems(true, { filters: { state: ItemState.ACTIVE } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    fetchItems(false, { filters: { state: ItemState.ACTIVE } });
  }, [fetchItems]);

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <InfiniteItemList loadMore={loadMore} />
    </div>
  );
};

export default HomePage;
