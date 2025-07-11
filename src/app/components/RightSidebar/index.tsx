import BulkActions from "@app/components/Items/ItemActions/BulkActions";
import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import Spinner from "@app/components/ui/Spinner";
import { useAppLayout } from "@app/providers/AppLayout";
import { useSidebarSwipe } from "@app/providers/AppLayout/useSidebarSwipe"; // Import the hook
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { HighlightsContext } from "@app/providers/Highlights";
import { ItemsContext } from "@app/providers/Items";
import { cn } from "@app/utils/cn";
import React, { useContext } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi2";

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

  const sidebarOpen = rightSidebarOpen;

  const bind = useSidebarSwipe({
    isOpen: sidebarOpen,
    onOpen: () => updateAppLayout({ rightSidebarOpen: true }),
    onClose: () => updateAppLayout({ rightSidebarOpen: false }),
    side: "right",
  });

  const toggleSidebar = (): void => {
    updateAppLayout({ rightSidebarOpen: !sidebarOpen });
  };

  return (
    <aside
      {...bind()}
      id="right-sidebar"
      className={cn(
        "flex flex-col justify-between border-l-1 border-divider transition-all duration-300 ease-in-out fixed right-0 top-0 bottom-0 lg:relative bg-background-400 shadow-lg z-20",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] h-full",
        rightSidebarOpen
          ? "w-80 max-w-full pointer-events-auto"
          : "w-0 pointer-events-none lg:w-16",
      )}
    >
      <div className="flex-1 overflow-hidden relative">
        <div
          className={cn(
            "h-full w-80 max-w-full transition-all duration-300 ease-in-out transform", // Explicit width needed for transition
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
        size="sm"
        variant="flat"
        onPress={toggleSidebar}
        aria-label={rightSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(
          "flex-none m-2 z-10 pointer-events-auto",
          rightSidebarOpen
            ? ""
            : "fixed right-0 bottom-[env(safe-area-inset-bottom)] lg:bottom-0 lg:relative lg:self-center",
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
    </aside>
  );
};

export default RightSidebar;
