import { cn } from "@app/utils/cn";
import { Highlight, NewHighlight } from "@shared/v1/items/highlights";
import React, { useRef } from "react";

const isHighlightWithId = (
  highlight: Highlight | NewHighlight,
): highlight is Highlight => "id" in highlight;

interface HighlightSpanProps {
  id: string;
  highlight: Highlight | NewHighlight;
  children: React.ReactNode;
  startOffset: number;
  endOffset: number;
  isSelected?: boolean;
  onClick?: (highlight: Highlight) => void;
}

export const HighlightSpan: React.FC<HighlightSpanProps> = ({
  id,
  highlight,
  children,
  startOffset,
  endOffset,
  isSelected,
  onClick,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  return (
    <>
      <span
        id={id}
        ref={spanRef}
        className={cn(
          "cursor-pointer",
          highlight.id
            ? "bg-warning-300 dark:bg-warning-800"
            : "bg-warning-400 dark:bg-warning-700",
          isSelected ? "bg-warning dark:bg-warning dark:text-default-950" : "",
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
