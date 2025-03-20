import React, { useContext } from "react";

import { useAppPage } from "@/providers/AppPageProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";

import { useArticleUpdate } from "./actions";
import { useScrollProgress } from "./useScrollProgress";

interface ScrollProgressTrackerProps {}

const ScrollProgressTracker: React.FC<ScrollProgressTrackerProps> = ({}) => {
  const { loadedItem, isEditable } = useContext(CurrentItemContext);
  const { updateReadingProgress } = useArticleUpdate();
  const { containerRef } = useAppPage();

  const readingProgress = isEditable(loadedItem?.item)
    ? loadedItem?.item.metadata.readingProgress || 0
    : 0;

  const progressChangeHandler = isEditable(loadedItem?.item)
    ? updateReadingProgress
    : undefined;

  useScrollProgress({
    initialProgress: readingProgress,
    containerRef,
    onProgressChange: progressChangeHandler,
  });

  return null;
};

export default ScrollProgressTracker;
