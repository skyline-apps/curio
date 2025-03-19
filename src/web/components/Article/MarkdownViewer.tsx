import React, { memo, useMemo, useRef } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { type Highlight } from "@/app/api/v1/items/highlights/validation";
import { cn } from "@/utils/cn";

import { useHighlightSelection } from "./useHighlightSelection";
import {
  ALL_COMPONENTS,
  removeHighlightsOverlap,
  wrapMarkdownComponent,
} from "./wrapMarkdownComponent";

interface MarkdownViewerProps {
  highlights: Highlight[];
  className?: string;
  children?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = memo(
  ({ highlights, className, children }: MarkdownViewerProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const {
      handleSelection,
      draftHighlight,
      selectDraftHighlight,
      clearSelection,
    } = useHighlightSelection({
      contentRef,
    });

    const nonOverlappingHighlights = useMemo(
      () => removeHighlightsOverlap(highlights, draftHighlight),
      [highlights, draftHighlight],
    );

    const components: Components = useMemo(
      () =>
        Object.fromEntries(
          ALL_COMPONENTS.map((c) => [
            c,
            wrapMarkdownComponent(
              c,
              nonOverlappingHighlights,
              draftHighlight,
              selectDraftHighlight,
            ),
          ]),
        ),
      [nonOverlappingHighlights, draftHighlight, selectDraftHighlight],
    );

    const remarkPlugins = useMemo(() => [remarkGfm], []);
    const rehypePlugins = useMemo(() => [rehypeRaw], []);

    return (
      <div className="relative flex gap-4">
        <div
          ref={contentRef}
          onMouseDown={(event) => event.button === 0 && clearSelection()}
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
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={components}
          >
            {children || ""}
          </ReactMarkdown>
        </div>
      </div>
    );
  },
);

MarkdownViewer.displayName = "MarkdownViewer";

export default MarkdownViewer;
