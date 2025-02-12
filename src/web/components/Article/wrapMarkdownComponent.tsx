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

export function removeHighlightsOverlap(
  existingHighlights: Highlight[],
  currentHighlight: NewHighlight | null,
): Highlight[] {
  if (!currentHighlight) return existingHighlights;
  const resultHighlights: Highlight[] = [];
  existingHighlights.forEach((h) => {
    if (
      h.startOffset >= currentHighlight.startOffset &&
      h.endOffset <= currentHighlight.endOffset
    ) {
      // Completely contained, don't render
    } else if (
      h.endOffset > currentHighlight.startOffset &&
      h.endOffset < currentHighlight.endOffset
    ) {
      // Overlaps before current highlight, truncate the end
      resultHighlights.push({ ...h, endOffset: currentHighlight.startOffset });
    } else if (
      h.startOffset > currentHighlight.startOffset &&
      h.startOffset < currentHighlight.endOffset
    ) {
      // Overlaps after current highlight, truncate the start
      resultHighlights.push({ ...h, startOffset: currentHighlight.endOffset });
    } else {
      resultHighlights.push({ ...h });
    }
  });

  return resultHighlights;
}

export const wrapMarkdownComponent = <T extends keyof JSX.IntrinsicElements>(
  tag: T,
  highlights: Highlight[],
  newHighlight?: NewHighlight | null,
): React.FC<MarkdownProps<T>> => {
  const allHighlights = newHighlight
    ? [...highlights, newHighlight]
    : highlights;

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

    // Check if the entire node should be highlighted
    const containingHighlight = allHighlights.find(
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

    const overlappingHighlights = allHighlights
      .filter((h) => h.startOffset < endOffset && h.endOffset > startOffset)
      .sort((a, b) => a.startOffset - b.startOffset);

    if (overlappingHighlights.length === 0) {
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

    // Process each child individually
    const processedChildren: React.ReactNode[] = [];
    let currentOffset = startOffset;

    React.Children.forEach(children, (child) => {
      if (typeof child === "string") {
        // For text nodes, split and highlight as needed
        let pos = currentOffset;
        const text = child;
        const textEnd = currentOffset + text.length;

        // Find highlights that overlap with this text node
        const textHighlights = overlappingHighlights.filter(
          (h) => h.startOffset < textEnd && h.endOffset > pos,
        );

        if (textHighlights.length === 0) {
          processedChildren.push(text);
        } else {
          textHighlights.forEach((highlight) => {
            // Add non-highlighted text before this highlight
            if (highlight.startOffset > pos) {
              processedChildren.push(
                text.slice(
                  pos - currentOffset,
                  highlight.startOffset - currentOffset,
                ),
              );
            }

            // Add highlighted text
            const highlightEnd = Math.min(highlight.endOffset, textEnd);
            const highlightedText = text.slice(
              Math.max(0, highlight.startOffset - currentOffset),
              highlightEnd - currentOffset,
            );

            if (highlightedText) {
              processedChildren.push(
                <HighlightSpan
                  key={`${highlight.startOffset}-${highlightEnd}`}
                  highlight={highlight}
                  startOffset={Math.max(currentOffset, highlight.startOffset)}
                  endOffset={highlightEnd}
                >
                  {highlightedText}
                </HighlightSpan>,
              );
            }

            pos = highlightEnd;
          });

          // Add remaining non-highlighted text
          if (pos < textEnd) {
            processedChildren.push(text.slice(pos - currentOffset));
          }
        }

        currentOffset = textEnd;
      } else if (React.isValidElement(child)) {
        // For element nodes, check if they're fully contained in a highlight
        const childNode = child.props.node as MarkdownNode | undefined;
        const childStart = childNode?.position?.start?.offset ?? currentOffset;
        const childEnd = childNode?.position?.end?.offset ?? childStart + 1;

        processedChildren.push(child);

        currentOffset = childEnd;
      } else if (child != null) {
        // For any other non-null children, preserve them
        processedChildren.push(child);
      }
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
