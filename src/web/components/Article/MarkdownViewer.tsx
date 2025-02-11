import React, { useRef } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  CreateOrUpdateHighlightResponse,
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { ReadItemResponse } from "@/app/api/v1/items/read/validation";
import { useAppPage } from "@/providers/AppPageProvider";
import { cn } from "@/utils/cn";

import { SelectionTooltip } from "./SelectionTooltip";
import { useHighlightSelection } from "./useHighlightSelection";
import { useScrollProgress } from "./useScrollProgress";
import { ALL_COMPONENTS, wrapMarkdownComponent } from "./wrapMarkdownComponent";

interface MarkdownViewerProps {
  readingProgress: number;
  onProgressChange?: (progress: number) => Promise<ReadItemResponse>;
  highlights: Highlight[];
  onHighlight?: (
    highlight: NewHighlight,
  ) => Promise<CreateOrUpdateHighlightResponse>;
  className?: string;
  children?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  readingProgress,
  onProgressChange,
  highlights,
  onHighlight,
  className,
  children,
}) => {
  const { containerRef } = useAppPage();
  const contentRef = useRef<HTMLDivElement>(null);

  useScrollProgress({
    initialProgress: readingProgress,
    containerRef,
    onProgressChange,
  });

  const {
    handleSelection,
    currentSelection,
    currentHighlight,
    clearSelection,
    isScrolling,
  } = useHighlightSelection({
    contentRef,
  });

  const handleSaveHighlight = async (
    highlight: NewHighlight,
  ): Promise<void> => {
    if (onHighlight) {
      await onHighlight(highlight);
    }
    clearSelection();
  };

  const components: Components = Object.fromEntries(
    ALL_COMPONENTS.map((c) => [c, wrapMarkdownComponent(c, highlights)]),
  );

  return (
    <div
      ref={contentRef}
      onMouseUp={handleSelection}
      className={cn(
        "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:!text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children || ""}
      </ReactMarkdown>

      {currentSelection &&
        currentHighlight &&
        currentSelection.rangeCount > 0 &&
        !isScrolling && (
          <SelectionTooltip
            selection={currentSelection}
            highlight={currentHighlight}
            onSave={handleSaveHighlight}
            addNote={() => {}} /* TODO */
          />
        )}
    </div>
  );
};

export default MarkdownViewer;
