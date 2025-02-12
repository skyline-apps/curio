import React from "react";

import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { cn } from "@/utils/cn";

interface HighlightSpanProps {
  highlight: Highlight | NewHighlight;
  children: React.ReactNode;
  startOffset?: number;
  endOffset?: number;
}

export const HighlightSpan: React.FC<HighlightSpanProps> = ({
  highlight,
  children,
  startOffset,
  endOffset,
}) => {
  return (
    <span
      className={cn(
        highlight.id
          ? "bg-warning-300 dark:bg-warning-800"
          : "bg-warning-400 dark:bg-warning-700",
      )}
      title={highlight.note || undefined}
      data-start-offset={startOffset}
      data-end-offset={endOffset}
    >
      {children}
    </span>
  );
};
