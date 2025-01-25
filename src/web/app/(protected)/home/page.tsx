"use client";
import React, { useContext, useEffect } from "react";

import ItemList from "@/components/Items/ItemList";
import { ItemsContext } from "@/providers/ItemsProvider";

const HomePage: React.FC = () => {
  const { fetchItems } = useContext(ItemsContext);

  useEffect(() => {
    fetchItems({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col justify-between gap-12">
      <div className="w-full flex-grow">
        <ItemList />
      </div>
    </div>
  );
};

export default HomePage;
