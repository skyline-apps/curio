import React from "react";

import { type Highlight } from "@/app/api/v1/items/highlights/validation";

interface HighlightSpanProps {
  highlight: Highlight;
  children: React.ReactNode;
}

export const HighlightSpan: React.FC<HighlightSpanProps> = ({
  highlight,
  children,
}) => {
  return (
    <span
      className="bg-warning-300 dark:bg-warning-700"
      title={highlight.note || undefined}
    >
      {children}
    </span>
  );
};
