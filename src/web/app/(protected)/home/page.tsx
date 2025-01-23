"use client";
import React, { useContext, useEffect } from "react";

import ItemList from "@/components/Items/ItemList";
import { Progress } from "@/components/ui/Progress";
import { ItemsContext } from "@/providers/ItemsProvider";

const HomePage: React.FC = () => {
  const { isLoading, fetchItems } = useContext(ItemsContext);

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
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="w-full">
          <ItemList />
        </div>
      </div>
    </>
  );
};

export default HomePage;
