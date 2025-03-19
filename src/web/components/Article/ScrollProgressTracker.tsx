import React from "react";

import { ReadItemResponse } from "@/app/api/v1/items/read/validation";

import { useScrollProgress } from "./useScrollProgress";

interface ScrollProgressTrackerProps {
  initialProgress: number;
  containerRef: React.RefObject<HTMLElement>;
  onProgressChange?: (progress: number) => Promise<ReadItemResponse>;
}

const ScrollProgressTracker: React.FC<ScrollProgressTrackerProps> = ({
  initialProgress,
  containerRef,
  onProgressChange,
}) => {
  useScrollProgress({
    initialProgress,
    containerRef,
    onProgressChange,
  });

  return null;
};

export default ScrollProgressTracker;
