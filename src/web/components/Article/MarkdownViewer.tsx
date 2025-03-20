import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { type Highlight } from "@/app/api/v1/items/highlights/validation";
import { cn } from "@/utils/cn";

import { SelectionPopup } from "./SelectionPopup";
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
  isEditable?: boolean;
}

const useSelectionListeners = (handleSelection: () => void): void => {
  useEffect(() => {
    window.addEventListener("mouseup", handleSelection);
    window.addEventListener("touchend", handleSelection);

    return () => {
      window.removeEventListener("mouseup", handleSelection);
      window.removeEventListener("touchend", handleSelection);
    };
  }, [handleSelection]);
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = memo(
  ({ highlights, className, children, isEditable }: MarkdownViewerProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const {
      currentSelection,
      handleSelection,
      saveHighlight,
      isSavingHighlight,
      selectedHighlight,
      updateSelectedHighlight,
      clearSelectedHighlight,
      clearSelection,
    } = useHighlightSelection({
      contentRef,
    });

    const nonOverlappingHighlights = useMemo(
      () => removeHighlightsOverlap(highlights),
      [highlights],
    );

    const components: Components = useMemo(
      () =>
        Object.fromEntries(
          ALL_COMPONENTS.map((c) => [
            c,
            wrapMarkdownComponent(
              c,
              nonOverlappingHighlights,
              selectedHighlight,
              updateSelectedHighlight,
            ),
          ]),
        ),
      [nonOverlappingHighlights, selectedHighlight, updateSelectedHighlight],
    );

    const clearSelections = useCallback(() => {
      clearSelection();
      clearSelectedHighlight();
    }, [clearSelection, clearSelectedHighlight]);

    useSelectionListeners(handleSelection);

    return (
      <div className="relative flex gap-4">
        <div
          ref={contentRef}
          onMouseDown={useCallback(
            (event: React.MouseEvent) =>
              event.button === 0 && clearSelections(),
            [clearSelections],
          )}
          onTouchStart={clearSelections}
          className={cn(
            "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:text-default-foreground hover:prose-a:!text-primary dark:prose-invert relative",
            className,
          )}
        >
          <ReactMarkdown
            className="select-text"
            remarkPlugins={useMemo(() => [remarkGfm], [])}
            rehypePlugins={useMemo(() => [rehypeRaw], [])}
            components={components}
          >
            {children || ""}
          </ReactMarkdown>
        </div>
        {currentSelection && (
          <SelectionPopup
            selection={currentSelection}
            containerRef={contentRef}
            onHighlightSave={isEditable ? saveHighlight : undefined}
            isSaving={isSavingHighlight}
          />
        )}
      </div>
    );
  },
);

MarkdownViewer.displayName = "MarkdownViewer";

export default MarkdownViewer;
