"use client";
import React, { useCallback, useContext, useEffect } from "react";

import ItemList from "@/components/Items/ItemList";
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
      <ItemList loadMore={loadMore} />
    </div>
  );
};

export default FavoritesPage;
