import React, { useContext } from "react";

import { useAppPage } from "@/providers/AppPageProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { Item } from "@/providers/ItemsProvider";

import { useArticleUpdate } from "./actions";
import { useScrollProgress } from "./useScrollProgress";

interface ScrollProgressTrackerProps {}

const ScrollProgressTracker: React.FC<ScrollProgressTrackerProps> = React.memo(
  () => {
    const { loadedItem, isEditable } = useContext(CurrentItemContext);
    const { updateReadingProgress } = useArticleUpdate();
    const { containerRef } = useAppPage();

    // Store mutable item state in a ref to prevent re-renders
    const itemStateRef = React.useRef<{
      item: Item | undefined;
      isEditable: boolean;
      readingProgress: number;
    }>({ item: undefined, isEditable: false, readingProgress: 0 });

    // Update ref when item changes
    const item = loadedItem?.item as Item | undefined;
    const isItemEditable = isEditable(item);
    const progress = isItemEditable ? item?.metadata?.readingProgress ?? 0 : 0;

    itemStateRef.current = {
      item,
      isEditable: isItemEditable,
      readingProgress: progress,
    };

    // Create a stable progress handler that reads from the ref
    const progressChangeHandler = React.useCallback(
      async (newProgress: number) => {
        const state = itemStateRef.current;
        if (state.isEditable && state.item) {
          await updateReadingProgress(newProgress);
        }
      },
      [updateReadingProgress],
    );

    // Use the scroll hook with stable values
    useScrollProgress({
      initialProgress: itemStateRef.current.readingProgress,
      containerRef,
      onProgressChange: progressChangeHandler,
    });

    return null;
  },
);

ScrollProgressTracker.displayName = "ScrollProgressTracker";

export default ScrollProgressTracker;
