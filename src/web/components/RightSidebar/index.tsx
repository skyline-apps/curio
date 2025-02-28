"use client";
import React, { useContext } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

import BulkActions from "@/components/Items/ItemActions/BulkActions";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";
import { useAppLayout } from "@/providers/AppLayoutProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";
import { cn } from "@/utils/cn";

import HighlightMetadata from "./HighlightMetadata";
import ItemMetadata from "./ItemMetadata";

const RightSidebar: React.FC = () => {
  const {
    selectedItems,
    currentItem,
    isCurrentlyPreviewing,
    draftHighlight,
    isEditable,
    fetching,
  } = useContext(CurrentItemContext);
  const {
    appLayout: { rightSidebarOpen },
    updateAppLayout,
  } = useAppLayout();
  const { totalItems } = useContext(ItemsContext);

  const toggleSidebar = (): void => {
    updateAppLayout({ rightSidebarOpen: !rightSidebarOpen });
  };

  // TODO: Add transition for content appearing
  return (
    <aside
      className={cn(
        "h-screen border-l-1 border-divider transition-all duration-300 ease-in-out absolute right-0 lg:relative bg-background-400 shadow-lg",
        rightSidebarOpen ? "w-80" : "w-0 lg:w-16",
      )}
    >
      <div id="right-sidebar" className="flex flex-col justify-between h-full">
        <div className="grow overflow-hidden">
          <div
            className={cn(
              "h-full w-80 transition-all duration-300 ease-in-out transform", // Explicit width needed for transition
              rightSidebarOpen
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0",
            )}
          >
            {rightSidebarOpen &&
              (draftHighlight && isEditable(currentItem) ? (
                <HighlightMetadata />
              ) : currentItem ? (
                <ItemMetadata
                  item={currentItem}
                  readonly={isCurrentlyPreviewing}
                />
              ) : selectedItems.size > 0 ? (
                <>
                  <p className="text-secondary text-center pt-16">
                    {selectedItems.size} items selected
                  </p>
                  <p className="text-secondary-600 text-center pb-8">
                    {totalItems} total
                  </p>
                  {selectedItems.size > 0 && <BulkActions />}
                </>
              ) : fetching ? (
                <Spinner centered />
              ) : null)}
          </div>
        </div>
        <Button
          isIconOnly
          variant="faded"
          onPress={toggleSidebar}
          aria-label={rightSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "flex-none w-10 m-2 flex",
            rightSidebarOpen ? "" : "absolute right-0 bottom-0 lg:relative",
          )}
        >
          <Icon
            icon={
              rightSidebarOpen ? (
                <HiChevronDoubleRight />
              ) : (
                <HiChevronDoubleLeft />
              )
            }
          />
        </Button>
      </div>
    </aside>
  );
};

export default RightSidebar;
