"use client";
import React, { useContext } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

import BulkActions from "@web/components/Items/ItemActions/BulkActions";
import Button from "@web/components/ui/Button";
import Icon from "@web/components/ui/Icon";
import Spinner from "@web/components/ui/Spinner";
import { useAppLayout } from "@web/providers/AppLayoutProvider";
import { CurrentItemContext } from "@web/providers/CurrentItemProvider";
import { HighlightsContext } from "@web/providers/HighlightsProvider";
import { ItemsContext } from "@web/providers/ItemsProvider";
import { cn } from "@web/utils/cn";

import HighlightMetadata from "./HighlightMetadata";
import ItemMetadata from "./ItemMetadata";

const RightSidebar: React.FC = () => {
  // Context from the current selected item if viewing from the items pages
  const {
    selectedItems,
    currentItem,
    isCurrentlyPreviewing,
    selectedHighlight,
    setSelectedHighlight,
    isEditable,
    fetching,
  } = useContext(CurrentItemContext);
  // Context from the highlight if viewing from the notes page
  const {
    selectedHighlight: selectedHighlightPreview,
    selectHighlight: setSelectedHighlightPreview,
  } = useContext(HighlightsContext);
  const {
    appLayout: { rightSidebarOpen },
    updateAppLayout,
  } = useAppLayout();
  const { totalItems } = useContext(ItemsContext);

  const toggleSidebar = (): void => {
    updateAppLayout({ rightSidebarOpen: !rightSidebarOpen });
  };

  return (
    <aside
      className={cn(
        "h-dvh border-l-1 border-divider transition-all duration-300 ease-in-out absolute right-0 lg:relative bg-background-400 shadow-lg",
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
              (selectedHighlight && isEditable(currentItem) ? (
                <HighlightMetadata
                  highlight={selectedHighlight}
                  itemSlug={currentItem.slug}
                  textDirection={currentItem.metadata.textDirection}
                  onUpdate={setSelectedHighlight}
                />
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
              ) : selectedHighlightPreview ? (
                <HighlightMetadata
                  highlight={selectedHighlightPreview}
                  itemSlug={selectedHighlightPreview.item.slug}
                  textDirection={
                    selectedHighlightPreview.item.metadata.textDirection
                  }
                  onUpdate={(highlight) =>
                    setSelectedHighlightPreview(highlight?.id || null)
                  }
                />
              ) : (
                <p className="text-secondary text-center pt-24">
                  Select an item to preview it here.
                </p>
              ))}
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
