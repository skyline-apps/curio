import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { type NewHighlight } from "@/app/api/v1/items/highlights/validation";
import { createLogger } from "@/utils/logger";

const log = createLogger("useHighlightSelection");

interface UseHighlightSelectionProps {
  contentRef: RefObject<HTMLElement>;
}

interface UseHighlightSelectionResult {
  handleSelection: () => Promise<void>;
  currentSelection: Selection | null;
  currentHighlight: NewHighlight | null;
  clearSelection: () => void;
  isScrolling: boolean;
}

function findPreviousOffset(node: Node): number {
  let current = node.previousSibling;
  while (current) {
    if (current instanceof Element && current.hasAttribute("data-end-offset")) {
      return parseInt(current.getAttribute("data-end-offset") || "0", 10);
    }
    current = current.previousSibling;
  }
  return 0;
}

export function useHighlightSelection({
  contentRef,
}: UseHighlightSelectionProps): UseHighlightSelectionResult {
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(
    null,
  );
  const [currentHighlight, setCurrentHighlight] = useState<NewHighlight | null>(
    null,
  );
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number>();

  const clearSelection = useCallback(() => {
    if (currentSelection) {
      currentSelection.removeAllRanges();
    }
    setCurrentSelection(null);
    setCurrentHighlight(null);
  }, [currentSelection]);

  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolling(true);

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      // Set new timeout to mark scrolling as done
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSelection = useCallback(async () => {
    const selection = window.getSelection();
    if (!selection || !contentRef.current || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!range || range.collapsed) {
      return;
    }

    try {
      const selectedText = selection.toString().trim();
      if (!selectedText) {
        return;
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
        return;
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

      setCurrentSelection(selection);
      setCurrentHighlight(highlight);
    } catch (error) {
      log.error("Error handling selection:", error);
    }
  }, [contentRef]);

  return {
    handleSelection,
    currentSelection,
    currentHighlight,
    clearSelection,
    isScrolling,
  };
}
