import { type RefObject, useCallback, useContext } from "react";

import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { useAppLayout } from "@/providers/AppLayoutProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { createLogger } from "@/utils/logger";

const log = createLogger("useHighlightSelection");

interface UseHighlightSelectionProps {
  contentRef: RefObject<HTMLElement>;
}

interface UseHighlightSelectionResult {
  handleSelection: () => Promise<void>;
  draftHighlight: Highlight | NewHighlight | null;
  selectDraftHighlight: (highlight: Highlight) => void;
  clearSelection: () => void;
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

export function useHighlightSelection({
  contentRef,
}: UseHighlightSelectionProps): UseHighlightSelectionResult {
  const { updateAppLayout } = useAppLayout();
  const { draftHighlight, setDraftHighlight } = useContext(CurrentItemContext);

  const selectDraftHighlight = useCallback(
    (highlight: Highlight) => {
      updateAppLayout({ rightSidebarOpen: true });
      setDraftHighlight(highlight);
    },
    [updateAppLayout, setDraftHighlight],
  );

  const clearSelection = useCallback(() => {
    setDraftHighlight(null);
  }, [setDraftHighlight]);

  const handleSelection = useCallback(async () => {
    const selection = window.getSelection();
    if (!selection || !contentRef.current || selection.rangeCount === 0) {
      return;
    }

    try {
      const highlight = calculateHighlight(selection);
      if (!highlight) {
        return;
      }

      selection.removeAllRanges();
      setDraftHighlight(highlight);
    } catch (error) {
      log.error("Error handling selection:", error);
    }
  }, [contentRef, setDraftHighlight]);

  return {
    handleSelection,
    draftHighlight,
    selectDraftHighlight,
    clearSelection,
  };
}
