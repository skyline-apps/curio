import { useAppPage } from "@app/providers/AppPage";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { Item } from "@app/providers/Items";
import React, { useContext } from "react";

import { useArticleUpdate } from "./actions";
import { useScrollProgress } from "./useScrollProgress";

type ScrollProgressTrackerProps = Record<never, never>;

const ScrollProgressTracker: React.FC<ScrollProgressTrackerProps> = React.memo(
  () => {
    const { loadedItem, isEditable, viewingSummary } =
      useContext(CurrentItemContext);
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
    const progress = isItemEditable
      ? (item?.metadata?.readingProgress ?? 0)
      : 0;

    itemStateRef.current = {
      item,
      isEditable: isItemEditable,
      readingProgress: progress,
    };

    // Create a stable progress handler that reads from the ref
    const progressChangeHandler = React.useCallback(
      async (newProgress: number) => {
        const state = itemStateRef.current;
        if (state.isEditable && state.item && !viewingSummary) {
          await updateReadingProgress(newProgress);
        }
      },
      [updateReadingProgress, viewingSummary],
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
