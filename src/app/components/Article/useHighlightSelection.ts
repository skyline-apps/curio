import { useHighlightUpdate } from "@app/components/RightSidebar/highlightActions";
import { useAppLayout } from "@app/providers/AppLayout";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { useToast } from "@app/providers/Toast";
import { Highlight, NewHighlight } from "@app/schemas/v1/items/highlights";
import { createLogger } from "@app/utils/logger";
import { useCallback, useContext, useState } from "react";

const log = createLogger("useHighlightSelection");

type UseHighlightSelectionProps = Record<never, never>;

interface UseHighlightSelectionResult {
  currentSelection: Selection | null;
  handleSelection: () => void;
  clearSelection: () => void;
  saveHighlight: () => Promise<void>;
  isSavingHighlight: boolean;
  selectedHighlight: Highlight | null;
  updateSelectedHighlight: (highlight: Highlight) => void;
  clearSelectedHighlight: () => void;
}

export function findPreviousOffset(node: Node): number {
  let current = node.previousSibling;
  while (current) {
    if (current instanceof Element && current.hasAttribute("data-end-offset")) {
      return parseInt(current.getAttribute("data-end-offset") || "0", 10);
    }
    current = current.previousSibling;
  }
  return 0;
}

export function calculateHighlight(selection: Selection): NewHighlight | null {
  const range = selection.getRangeAt(0);
  if (!range || range.collapsed) {
    return null;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) {
    return null;
  }
  // Get the closest elements with data-start-offset and data-end-offset
  const startElement =
    range.startContainer instanceof Element
      ? range.startContainer
      : range.startContainer.parentElement;
  const endElement =
    range.endContainer instanceof Element
      ? range.endContainer
      : range.endContainer.parentElement;

  // Check if both elements have data-start-offset
  if (
    !startElement?.hasAttribute("data-start-offset") ||
    !endElement?.hasAttribute("data-start-offset")
  ) {
    log.debug("Ignoring selection - missing data-start-offset attribute");
    return null;
  }

  // Get the offsets from the data attributes
  const startBaseOffset = parseInt(
    startElement.getAttribute("data-start-offset") || "0",
    10,
  );
  const endBaseOffset = parseInt(
    endElement.getAttribute("data-start-offset") || "0",
    10,
  );

  // Find the offset from the previous sibling with data-end-offset
  const startPrevOffset = findPreviousOffset(range.startContainer);
  const endPrevOffset = findPreviousOffset(range.endContainer);

  // Calculate final offsets using previous sibling's end offset
  const finalStartOffset =
    Math.max(startBaseOffset, startPrevOffset) + range.startOffset;
  const finalEndOffset =
    Math.max(endBaseOffset, endPrevOffset) + range.endOffset;

  const highlight = {
    text: selectedText,
    startOffset: finalStartOffset,
    endOffset: finalEndOffset,
    note: "",
  };
  return highlight;
}

export function useHighlightSelection({}: UseHighlightSelectionProps): UseHighlightSelectionResult {
  const { showToast } = useToast();
  const { updateAppLayout } = useAppLayout();
  const { currentItem, selectedHighlight, setSelectedHighlight } =
    useContext(CurrentItemContext);
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(
    null,
  );
  const { createHighlight, isUpdating } = useHighlightUpdate({
    currentHighlight: selectedHighlight,
    itemSlug: currentItem?.slug || "",
    onUpdate: setSelectedHighlight,
  });

  const handleSelection = useCallback((): void => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      setCurrentSelection(selection);
    } else {
      setCurrentSelection(null);
    }
  }, []);

  const clearSelection = useCallback((): void => {
    setCurrentSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const updateSelectedHighlight = useCallback(
    (highlight: Highlight) => {
      updateAppLayout({ rightSidebarOpen: true });
      setSelectedHighlight(highlight);
    },
    [updateAppLayout], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const clearSelectedHighlight = useCallback(() => {
    setSelectedHighlight(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveHighlight = useCallback(async () => {
    if (!currentSelection) {
      return;
    }
    try {
      const highlight = calculateHighlight(currentSelection);
      if (!highlight) {
        showToast("Invalid highlight");
        return;
      }

      await createHighlight(highlight);
      updateAppLayout({ rightSidebarOpen: true });
      clearSelection();
    } catch (error) {
      log.error("Error handling selection:", error);
      showToast("Error saving highlight");
    }
  }, [
    currentSelection,
    createHighlight,
    updateAppLayout,
    clearSelection,
    showToast,
  ]);

  return {
    currentSelection,
    handleSelection,
    clearSelection,
    selectedHighlight,
    updateSelectedHighlight,
    clearSelectedHighlight,
    saveHighlight,
    isSavingHighlight: isUpdating,
  };
}
