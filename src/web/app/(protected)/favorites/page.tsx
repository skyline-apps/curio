"use client";
import React, { useCallback, useContext, useEffect } from "react";

import InfiniteItemList from "@/components/Items/ItemList/InfiniteItemList";
import { ItemsContext } from "@/providers/ItemsProvider";

const FavoritesPage: React.FC = () => {
  const { fetchItems } = useContext(ItemsContext);

  useEffect(() => {
    fetchItems(true, { filters: { isFavorite: true } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    fetchItems(false, { filters: { isFavorite: true } });
  }, [fetchItems]);

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <InfiniteItemList loadMore={loadMore} />
    </div>
  );
};

export default FavoritesPage;
