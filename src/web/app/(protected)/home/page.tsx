"use client";
import React, { useContext, useEffect } from "react";

import ItemList from "@/components/Items/ItemList";
import Pagination, { DEFAULT_PAGE_SIZE } from "@/components/ui/Pagination";
import { ItemsContext } from "@/providers/ItemsProvider";

const HomePage: React.FC = () => {
  const { fetchItems, totalItems } = useContext(ItemsContext);
  const numberOfPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  useEffect(() => {
    fetchItems({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 w-full h-full flex flex-col justify-between gap-12">
      <div className="w-full flex-grow">
        <ItemList />
      </div>
      <div className="w-full flex justify-center sticky bottom-2">
        <Pagination isCompact showControls total={numberOfPages} />
      </div>
    </div>
  );
};

export default HomePage;
