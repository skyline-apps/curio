import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { HiMiniSparkles } from "react-icons/hi2";

interface SelectionPopupProps {
  selection: Selection | null;
  onHighlightSave?: () => Promise<void>;
  isSaving?: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
}

export const SelectionPopup = ({
  selection,
  onHighlightSave,
  isSaving,
  containerRef,
}: SelectionPopupProps): React.ReactElement | null => {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    opacity: number;
  } | null>(null);

  const updatePosition = useCallback(() => {
    if (!selection || !containerRef.current) return null;
    if (selection.rangeCount === 0) return null; // Check rangeCount first

    const range = selection.getRangeAt(0);
    if (range.collapsed) return null; // Check collapsed state

    const rangeRect = range.getBoundingClientRect(); // Use overall bounding box
    // Check for empty rects which can happen in some cases
    // Fixed lint error: Wrap long condition
    if (
      rangeRect.width === 0 &&
      rangeRect.height === 0 &&
      rangeRect.top === 0 &&
      rangeRect.left === 0
    ) {
      return null;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const scrollLeft = containerRef.current.scrollLeft;

    // Calculate position relative to the container, accounting for container scroll
    // Position roughly 50px above the top of the selection range
    const top = rangeRect.top - containerRect.top + scrollTop - 50;
    // Center horizontally based on the range's bounding box
    const left =
      rangeRect.left - containerRect.left + scrollLeft + rangeRect.width / 2;

    // Estimate popup dimensions for clamping (adjust if needed)
    const popupHeight = 50;
    const popupWidth = 120; // Adjust based on actual button/content width

    // Ensure popup stays within container bounds, adjusting for popup size
    const adjustedTop = Math.max(
      scrollTop + 10, // Min top padding relative to scroll position
      Math.min(top, containerRect.height + scrollTop - popupHeight - 10), // Max top within container
    );
    // Adjust left position to center the popup itself and clamp
    const adjustedLeft = Math.max(
      scrollLeft + 10, // Min left padding relative to scroll position
      Math.min(
        left - popupWidth / 2, // Center the popup
        containerRect.width + scrollLeft - popupWidth - 10, // Max left within container
      ),
    );

    return {
      top: adjustedTop,
      left: adjustedLeft,
      opacity: 1,
    };
  }, [selection, containerRef]);

  // Update position when selection changes
  useEffect(() => {
    const newPosition = updatePosition();
    setPosition(newPosition);
  }, [updatePosition, selection]);

  // Handle scroll and window resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePositionUpdate = (): void => setPosition(updatePosition());

    // Add scroll listener to container
    container.addEventListener("scroll", handlePositionUpdate);
    // Add resize listener to window
    window.addEventListener("resize", handlePositionUpdate);

    return () => {
      container.removeEventListener("scroll", handlePositionUpdate);
      window.removeEventListener("resize", handlePositionUpdate);
    };
  }, [containerRef, updatePosition]);

  return (
    <AnimatePresence>
      {position && selection && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute z-50 bg-background-400 dark:bg-background-600 shadow-lg rounded p-2 flex gap-2 items-center"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transformOrigin: "top center",
          }}
        >
          {onHighlightSave && (
            <Button
              size="xs"
              color="warning"
              isLoading={isSaving}
              onPress={onHighlightSave}
            >
              Highlight
            </Button>
          )}
          <Button
            size="xs"
            tooltip="Sorry, you don't have access to this feature."
            disabled
            onPress={() => {}}
          >
            <Icon icon={<HiMiniSparkles />} />
            Explain
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
