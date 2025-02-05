"use client";
import React, { useContext } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

import BulkActions from "@/components/Items/ItemActions/BulkActions";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { cn } from "@/utils/cn";

import ItemMetadata from "./ItemMetadata";

const RightSidebar: React.FC = () => {
  const { selectedItems, currentItem, sidebarOpen, setSidebarOpen } =
    useContext(CurrentItemContext);

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  // TODO: Add transition for content appearing
  return (
    <aside
      className={cn(
        "h-screen border-l-1 border-divider transition-all duration-300 ease-in-out absolute right-0 md:relative bg-background-400 shadow-lg",
        sidebarOpen ? "w-80" : "w-0 md:w-16",
      )}
    >
      <div id="right-sidebar" className="flex flex-col justify-between h-full">
        <div className="grow overflow-hidden">
          <div
            className={cn(
              "h-full w-80 transition-all duration-300 ease-in-out transform", // Explicit width needed for transition
              sidebarOpen
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0",
            )}
          >
            {sidebarOpen &&
              (currentItem ? (
                <ItemMetadata item={currentItem || undefined} />
              ) : (
                <>
                  <p className="text-secondary text-center py-8">
                    {selectedItems.size} items selected
                  </p>
                  <BulkActions />
                </>
              ))}
          </div>
        </div>
        <Button
          isIconOnly
          variant="faded"
          onPress={toggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "flex-none w-10 m-2 flex",
            sidebarOpen ? "" : "absolute right-0 bottom-0 md:relative",
          )}
        >
          <Icon
            icon={
              sidebarOpen ? <HiChevronDoubleRight /> : <HiChevronDoubleLeft />
            }
          />
        </Button>
      </div>
    </aside>
  );
};

export default RightSidebar;
