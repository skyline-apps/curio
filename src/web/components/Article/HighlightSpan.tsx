import React, { useRef } from "react";

import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { cn } from "@/utils/cn";

import SelectionTooltip, { isHighlightWithId } from "./SelectionTooltip";

interface HighlightSpanProps {
  includesPopover?: boolean;
  highlight: Highlight | NewHighlight;
  children: React.ReactNode;
  startOffset?: number;
  endOffset?: number;
  isSelected?: boolean;
  onClick?: (highlight: Highlight) => void;
  onSave: (highlight: NewHighlight | Highlight) => Promise<void>;
  onDelete: (highlight: Highlight) => Promise<void>;
}

export const HighlightSpan: React.FC<HighlightSpanProps> = ({
  includesPopover = false,
  highlight,
  children,
  startOffset,
  endOffset,
  isSelected,
  onClick,
  onSave,
  onDelete,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  return (
    <>
      {includesPopover && isSelected && (
        <SelectionTooltip
          onSave={onSave}
          highlight={highlight}
          onDelete={onDelete}
          spanRef={spanRef}
        />
      )}
      <span
        ref={spanRef}
        className={cn(
          "cursor-pointer",
          highlight.id
            ? "bg-warning-300 dark:bg-warning-800"
            : "bg-warning-400 dark:bg-warning-700",
          isSelected ? "bg-warning dark:bg-warning" : "",
        )}
        data-start-offset={startOffset}
        data-end-offset={endOffset}
        onClick={() => {
          if (isHighlightWithId(highlight) && onClick) {
            onClick(highlight);
          }
        }}
      >
        {children}
      </span>
    </>
  );
};
