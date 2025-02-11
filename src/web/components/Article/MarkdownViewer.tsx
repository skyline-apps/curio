import React, { type ComponentPropsWithoutRef, useRef } from "react";
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

import { HighlightSpan } from "./HighlightSpan";
import { SelectionTooltip } from "./SelectionTooltip";
import { useHighlightSelection } from "./useHighlightSelection";
import { useScrollProgress } from "./useScrollProgress";

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

interface MarkdownNode {
  position?: {
    start: {
      offset: number;
    };
    end: {
      offset: number;
    };
  };
  type?: string;
  value?: string;
}

type MarkdownProps<T extends keyof JSX.IntrinsicElements> =
  ComponentPropsWithoutRef<T> & {
    node?: MarkdownNode;
  };

const VOID_ELEMENTS = new Set([
  "img",
  "br",
  "hr",
  "area",
  "base",
  "basefont",
  "col",
  "embed",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const createComponentWithOffset = <T extends keyof JSX.IntrinsicElements>(
  tag: T,
  highlights: Highlight[],
): React.FC<MarkdownProps<T>> => {
  const MarkdownComponent = ({
    node,
    children,
    ...rest
  }: MarkdownProps<T>): JSX.Element => {
    const startOffset = node?.position?.start?.offset ?? 0;
    const endOffset = node?.position?.end?.offset ?? 0;

    // Skip highlighting for list containers and void elements
    if (tag === "ul" || tag === "ol" || VOID_ELEMENTS.has(tag)) {
      return React.createElement(
        tag,
        {
          "data-start-offset": startOffset,
          "data-end-offset": endOffset,
          ...rest,
        },
        children,
      );
    }

    // Find highlights that overlap with this node
    const nodeHighlights = highlights
      .filter((h) => h.startOffset < endOffset && h.endOffset > startOffset)
      .sort((a, b) => a.startOffset - b.startOffset);

    // If no highlights in this node, render normally
    if (nodeHighlights.length === 0) {
      return React.createElement(
        tag,
        {
          "data-start-offset": startOffset,
          "data-end-offset": endOffset,
          ...rest,
        },
        children,
      );
    }

    // Check if the entire node should be highlighted
    const containingHighlight = nodeHighlights.find(
      (h) => h.startOffset <= startOffset && h.endOffset >= endOffset,
    );

    if (containingHighlight) {
      return React.createElement(
        tag,
        {
          "data-start-offset": startOffset,
          "data-end-offset": endOffset,
          ...rest,
        },
        <HighlightSpan highlight={containingHighlight}>
          {children}
        </HighlightSpan>,
      );
    }

    // Process nodes recursively
    const processNode = (
      child: React.ReactNode,
      offset: number,
      parentNode?: MarkdownNode,
    ): [React.ReactNode, number] => {
      if (typeof child === "string") {
        const childStart = offset;
        const childEnd = childStart + child.length;

        // Find all highlights that overlap with this text
        const relevantHighlights = nodeHighlights
          .filter((h) => h.startOffset < childEnd && h.endOffset > childStart)
          .sort((a, b) => a.startOffset - b.startOffset);

        if (relevantHighlights.length === 0) {
          return [child, childEnd];
        }

        const elements: React.ReactNode[] = [];
        let pos = childStart;

        relevantHighlights.forEach((highlight) => {
          // Add non-highlighted text before
          if (highlight.startOffset > pos) {
            elements.push(
              child.slice(pos - childStart, highlight.startOffset - childStart),
            );
          }

          // Add highlighted text
          const highlightEnd = Math.min(highlight.endOffset, childEnd);
          elements.push(
            <HighlightSpan key={highlight.startOffset} highlight={highlight}>
              {child.slice(
                Math.max(0, highlight.startOffset - childStart),
                highlightEnd - childStart,
              )}
            </HighlightSpan>,
          );

          pos = highlightEnd;
        });

        // Add remaining non-highlighted text
        if (pos < childEnd) {
          elements.push(child.slice(pos - childStart));
        }

        return [elements, childEnd];
      }

      if (React.isValidElement(child)) {
        const childNode = child.props.node as MarkdownNode | undefined;
        const elementType = child.type as string;

        // For elements with position info, use their offsets
        if (childNode?.position?.start?.offset !== undefined) {
          const childStart = childNode.position.start.offset;
          const childEnd = childNode.position.end?.offset ?? childStart;

          // Skip highlighting for void elements
          if (VOID_ELEMENTS.has(elementType)) {
            return [child, childEnd];
          }

          // Check if this element is fully contained in a highlight
          const childHighlight = nodeHighlights.find(
            (h) => h.startOffset <= childStart && h.endOffset >= childEnd,
          );

          if (childHighlight) {
            return [
              React.cloneElement(child, {
                ...child.props,
                children: (
                  <HighlightSpan highlight={childHighlight}>
                    {child.props.children}
                  </HighlightSpan>
                ),
              }),
              childEnd,
            ];
          }

          // Process child's children with their own offset tracking
          const processedChildren = React.Children.map(
            child.props.children,
            (grandChild) => {
              const [processed, nextOffset] = processNode(
                grandChild,
                offset,
                childNode,
              );
              offset = nextOffset;
              return processed;
            },
          );

          return [
            React.cloneElement(child, {
              ...child.props,
              children: processedChildren,
            }),
            childEnd,
          ];
        } else {
          // For elements without position info, continue with current offset
          // Skip highlighting for void elements
          if (VOID_ELEMENTS.has(elementType)) {
            return [child, offset];
          }

          // Process child's children with current offset
          const processedChildren = React.Children.map(
            child.props.children,
            (grandChild) => {
              const [processed, nextOffset] = processNode(
                grandChild,
                offset,
                parentNode,
              );
              offset = nextOffset;
              return processed;
            },
          );

          return [
            React.cloneElement(child, {
              ...child.props,
              children: processedChildren,
            }),
            offset,
          ];
        }
      }

      return [child, offset];
    };

    let currentOffset = startOffset;
    const processedChildren = React.Children.map(children, (child) => {
      const [processed, nextOffset] = processNode(child, currentOffset, node);
      currentOffset = nextOffset;
      return processed;
    });

    return React.createElement(
      tag,
      {
        "data-start-offset": startOffset,
        "data-end-offset": endOffset,
        ...rest,
      },
      processedChildren,
    );
  };
  return MarkdownComponent;
};

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

  // Create components with current highlights
  const highlightComponents = {
    h1: createComponentWithOffset("h1", highlights),
    h2: createComponentWithOffset("h2", highlights),
    h3: createComponentWithOffset("h3", highlights),
    h4: createComponentWithOffset("h4", highlights),
    h5: createComponentWithOffset("h5", highlights),
    h6: createComponentWithOffset("h6", highlights),
    p: createComponentWithOffset("p", highlights),
    ul: createComponentWithOffset("ul", highlights),
    ol: createComponentWithOffset("ol", highlights),
    li: createComponentWithOffset("li", highlights),
    blockquote: createComponentWithOffset("blockquote", highlights),
    code: createComponentWithOffset("code", highlights),
    pre: createComponentWithOffset("pre", highlights),
    em: createComponentWithOffset("em", highlights),
    strong: createComponentWithOffset("strong", highlights),
    a: createComponentWithOffset("a", highlights),
    img: createComponentWithOffset("img", highlights),
    del: createComponentWithOffset("del", highlights),
    hr: createComponentWithOffset("hr", highlights),
    table: createComponentWithOffset("table", highlights),
    thead: createComponentWithOffset("thead", highlights),
    tbody: createComponentWithOffset("tbody", highlights),
    tr: createComponentWithOffset("tr", highlights),
    td: createComponentWithOffset("td", highlights),
    th: createComponentWithOffset("th", highlights),
  } as Components;

  return (
    <div
      ref={contentRef}
      onMouseUp={handleSelection}
      className={cn(
        "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:!text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={highlightComponents}
      >
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
