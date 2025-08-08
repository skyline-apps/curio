import BulkActions from "@app/components/Items/ItemActions/BulkActions";
import Spinner from "@app/components/ui/Spinner";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { HighlightsContext } from "@app/providers/Highlights";
import { ItemsContext } from "@app/providers/Items";
import React, { useContext } from "react";

import HighlightMetadata from "./HighlightMetadata";
import RightSidebar from "./index";
import ItemMetadata from "./ItemMetadata";

const AppRightSidebar: React.FC = () => {
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
  const { totalItems } = useContext(ItemsContext);

  const content = (
    <>
      {selectedHighlight && isEditable(currentItem) ? (
        <HighlightMetadata
          highlight={selectedHighlight}
          itemSlug={currentItem.slug}
          textDirection={currentItem.metadata.textDirection}
          onUpdate={setSelectedHighlight}
        />
      ) : currentItem ? (
        <ItemMetadata item={currentItem} readonly={isCurrentlyPreviewing} />
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
          textDirection={selectedHighlightPreview.item.metadata.textDirection}
          onUpdate={(highlight) =>
            setSelectedHighlightPreview(highlight?.id || null)
          }
        />
      ) : (
        <p className="text-secondary text-center pt-24">
          Select an item to preview it here.
        </p>
      )}
    </>
  );

  return <RightSidebar content={content} />;
};

export default AppRightSidebar;
