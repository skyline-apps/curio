"use client";
import React, { useContext, useEffect } from "react";

import ItemList from "@/components/Items/ItemList";
import Pagination, { DEFAULT_PAGE_SIZE } from "@/components/ui/Pagination";
import { Progress } from "@/components/ui/Progress";
import { ItemsContext } from "@/providers/ItemsProvider";

const HomePage: React.FC = () => {
  const { isLoading, fetchItems, totalItems } = useContext(ItemsContext);
  const numberOfPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  useEffect(() => {
    fetchItems({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {isLoading && (
        <Progress
          aria-label="Loading..."
          size="sm"
          isIndeterminate
          classNames={{
            base: "mb-4 absolute top-0 left-0",
            track: "rounded-none",
            indicator: "bg-gradient-to-r from-success to-primary",
          }}
        />
      )}
      <div className="flex-1 w-full h-full flex flex-col justify-between gap-12">
        <div className="w-full flex-grow">
          <ItemList />
        </div>
        <div className="w-full flex justify-center sticky bottom-2">
          <Pagination isCompact showControls total={numberOfPages} />
        </div>
      </div>
    </>
  );
};

export default HomePage;
