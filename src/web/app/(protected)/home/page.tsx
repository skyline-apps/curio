"use client";
import React, { useContext, useEffect } from "react";

import ItemList from "@/components/Items/ItemList";
import { ItemState } from "@/db/schema";
import { ItemsContext } from "@/providers/ItemsProvider";

const HomePage: React.FC = () => {
  const { fetchItems } = useContext(ItemsContext);

  useEffect(() => {
    fetchItems(true, { filters: { state: ItemState.ACTIVE } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col">
      <ItemList />
    </div>
  );
};

export default HomePage;
