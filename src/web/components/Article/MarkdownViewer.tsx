import React, { useRef } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { type Highlight } from "@/app/api/v1/items/highlights/validation";
import { ReadItemResponse } from "@/app/api/v1/items/read/validation";
import { useAppPage } from "@/providers/AppPageProvider";
import { cn } from "@/utils/cn";

import { useHighlightSelection } from "./useHighlightSelection";
import { useScrollProgress } from "./useScrollProgress";
import {
  ALL_COMPONENTS,
  removeHighlightsOverlap,
  wrapMarkdownComponent,
} from "./wrapMarkdownComponent";

interface MarkdownViewerProps {
  readingProgress: number;
  onProgressChange?: (progress: number) => Promise<ReadItemResponse>;
  highlights: Highlight[];
  className?: string;
  children?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  readingProgress,
  onProgressChange,
  highlights,
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
    draftHighlight,
    selectDraftHighlight,
    clearSelection,
  } = useHighlightSelection({
    contentRef,
  });

  const nonOverlappingHighlights = removeHighlightsOverlap(
    highlights,
    draftHighlight,
  );
  const components: Components = Object.fromEntries(
    ALL_COMPONENTS.map((c) => [
      c,
      wrapMarkdownComponent(
        c,
        nonOverlappingHighlights,
        draftHighlight,
        selectDraftHighlight,
      ),
    ]),
  );
  return (
    <div className="relative flex gap-4">
      <div
        ref={contentRef}
        onMouseDown={clearSelection}
        onTouchStart={clearSelection}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        className={cn(
          "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
          className,
        )}
      >
        <ReactMarkdown
          className="select-text"
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {children || ""}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownViewer;
