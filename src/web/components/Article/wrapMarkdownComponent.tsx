import React, { type ComponentPropsWithoutRef } from "react";

import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";

import { HighlightSpan } from "./HighlightSpan";

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

export const ALL_COMPONENTS: (keyof JSX.IntrinsicElements)[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "em",
  "strong",
  "a",
  "img",
  "del",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
];

export const wrapMarkdownComponent = <T extends keyof JSX.IntrinsicElements>(
  tag: T,
  highlights: Highlight[],
  newHighlight?: NewHighlight | null,
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

    const allHighlights = newHighlight
      ? [...highlights, newHighlight]
      : highlights;
    // Find highlights that overlap with this node
    const nodeHighlights = allHighlights
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
        <HighlightSpan
          highlight={containingHighlight}
          startOffset={startOffset}
          endOffset={endOffset}
        >
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
            <HighlightSpan
              key={highlight.startOffset}
              highlight={highlight}
              startOffset={highlight.startOffset}
              endOffset={highlightEnd}
            >
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
                  <HighlightSpan
                    highlight={childHighlight}
                    startOffset={childStart}
                    endOffset={childEnd}
                  >
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
