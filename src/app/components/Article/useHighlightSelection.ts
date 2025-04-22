import { useHighlightUpdate } from "@app/components/RightSidebar/highlightActions";
import { useAppLayout } from "@app/providers/AppLayout";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { useToast } from "@app/providers/Toast";
import { Highlight, NewHighlight } from "@app/schemas/v1/items/highlights";
import { createLogger } from "@app/utils/logger";
import { useCallback, useContext, useState } from "react";

const log = createLogger("useHighlightSelection");

type UseHighlightSelectionProps = Record<never, never>;

interface CapturedSelectionInfo {
  text: string;
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
  startBaseOffset: number;
  endBaseOffset: number;
}

interface UseHighlightSelectionResult {
  currentSelectionInfo: CapturedSelectionInfo | null;
  liveSelection: Selection | null;
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

function findLastTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const lastChild = node.childNodes[i];
      const found = findLastTextNode(lastChild);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function calculateHighlight(
  selectionInfo: CapturedSelectionInfo,
): NewHighlight | null {
  if (!selectionInfo.text) {
    return null;
  }

  const startPrevOffset = findPreviousOffset(selectionInfo.startContainer);
  const endPrevOffset = findPreviousOffset(selectionInfo.endContainer);

  // Calculate final offsets using captured base offsets
  const finalStartOffset =
    Math.max(selectionInfo.startBaseOffset, startPrevOffset) +
    selectionInfo.startOffset;

  // Calculate end offset using original logic first
  const finalEndOffset =
    Math.max(selectionInfo.endBaseOffset, endPrevOffset) +
    selectionInfo.endOffset;

  const highlight = {
    text: selectionInfo.text,
    startOffset: finalStartOffset,
    endOffset: finalEndOffset,
    note: "",
  };
  return highlight;
}

export function captureAndNormalizeSelectionInfo(
  selection: Selection | null,
): CapturedSelectionInfo | null {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  if (!text) {
    return null;
  }

  let capturedEndContainer = range.endContainer;
  let capturedEndOffset = range.endOffset;

  if (
    capturedEndContainer.nodeType === Node.ELEMENT_NODE &&
    capturedEndOffset > 0
  ) {
    const lastTextNode = findLastTextNode(capturedEndContainer);
    if (lastTextNode) {
      capturedEndContainer = lastTextNode;
      capturedEndOffset = lastTextNode.length;
    }
  }

  const startElement =
    range.startContainer instanceof Element
      ? range.startContainer
      : range.startContainer.parentElement;
  const endElement =
    capturedEndContainer instanceof Element
      ? capturedEndContainer
      : capturedEndContainer.parentElement;

  if (
    !startElement?.hasAttribute("data-start-offset") ||
    !endElement?.hasAttribute("data-start-offset")
  ) {
    return null;
  }

  const startBaseOffset = parseInt(
    startElement.getAttribute("data-start-offset") || "0",
    10,
  );
  const endBaseOffset = parseInt(
    endElement.getAttribute("data-start-offset") || "0",
    10,
  );

  return {
    text,
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: capturedEndContainer,
    endOffset: capturedEndOffset,
    startBaseOffset,
    endBaseOffset,
  };
}

export function useHighlightSelection({}: UseHighlightSelectionProps): UseHighlightSelectionResult {
  const { showToast } = useToast();
  const { updateAppLayout } = useAppLayout();
  const { currentItem, selectedHighlight, setSelectedHighlight } =
    useContext(CurrentItemContext);
  const [currentSelectionInfo, setCurrentSelectionInfo] =
    useState<CapturedSelectionInfo | null>(null);
  const [liveSelection, setLiveSelection] = useState<Selection | null>(null);
  const { createHighlight, isUpdating } = useHighlightUpdate({
    currentHighlight: selectedHighlight,
    itemSlug: currentItem?.slug || "",
    onUpdate: setSelectedHighlight,
  });

  const handleSelection = useCallback((): void => {
    const selection = window.getSelection();
    const capturedInfo = captureAndNormalizeSelectionInfo(selection);

    setCurrentSelectionInfo(capturedInfo);
    setLiveSelection(capturedInfo ? selection : null);
  }, []);

  const clearSelection = useCallback((): void => {
    setCurrentSelectionInfo(null);
    setLiveSelection(null);
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
    if (!currentSelectionInfo) {
      return;
    }
    try {
      const highlight = calculateHighlight(currentSelectionInfo);
      if (!highlight) {
        showToast("Invalid highlight");
        return;
      }

      await createHighlight(highlight);
      updateAppLayout({ rightSidebarOpen: true });
      clearSelection();
    } catch (error) {
      log.error("Error handling selection:", error);
      showToast("Error saving highlight.");
    }
  }, [
    currentSelectionInfo,
    createHighlight,
    updateAppLayout,
    clearSelection,
    showToast,
  ]);

  return {
    currentSelectionInfo,
    liveSelection,
    handleSelection,
    clearSelection,
    selectedHighlight,
    updateSelectedHighlight,
    clearSelectedHighlight,
    saveHighlight,
    isSavingHighlight: isUpdating,
  };
}
