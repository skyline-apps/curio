import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { HiMiniSparkles } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

interface SelectionPopupProps {
  selection: Selection | null;
  onHighlightSave: () => Promise<void>;
  isSaving?: boolean;
  containerRef: React.RefObject<HTMLElement>;
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
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed)
      return null;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    if (rects.length === 0) return null;

    const firstRect = rects[0];
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate position relative to the container
    const top = firstRect.top + window.scrollY - containerRect.top - 50; // 50px above selection
    const left = firstRect.left - containerRect.left + firstRect.width / 2 - 50; // Centered

    // Ensure popup stays within container bounds
    const adjustedTop = Math.max(
      10,
      Math.min(top, containerRef.current.scrollHeight - 60),
    );
    const adjustedLeft = Math.max(
      10,
      Math.min(left, containerRef.current.clientWidth - 100),
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

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = (): void => setPosition(updatePosition());
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
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
          <Button
            size="xs"
            color="warning"
            isLoading={isSaving}
            onPress={onHighlightSave}
          >
            Highlight
          </Button>
          <Button
            size="xs"
            tooltip="This feature is not yet available"
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
