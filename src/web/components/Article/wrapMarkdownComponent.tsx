import React, {
  type ComponentPropsWithoutRef,
  useContext,
  useEffect,
} from "react";

import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import Button from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { BrowserMessageContext } from "@/providers/BrowserMessageProvider";

import ArticleHeading from "./ArticleHeading";
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

interface LinkInfoProps extends React.PropsWithChildren {
  href?: string;
}

const LinkInfo: React.FC<LinkInfoProps> = ({
  children,
  href,
}: LinkInfoProps) => {
  const { saveItemContent } = useContext(BrowserMessageContext);

  return (
    <Tooltip
      content={
        <span className="flex items-center justify-center w-60 p-1 overflow-x-hidden select-none">
          {href && (
            <a
              href={href}
              target="_blank"
              className="underline text-xs truncate text-ellipsis"
            >
              {`${new URL(href).hostname}${new URL(href).pathname}`}
            </a>
          )}
          <Button
            className="shrink-0"
            size="xs"
            onPress={() => href && saveItemContent(href)}
          >
            Save to Curio
          </Button>
        </span>
      }
    >
      {children}
    </Tooltip>
  );
};

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

function childrenToText(children: React.ReactNode): string {
  if (Array.isArray(children)) {
    return children.reduce((acc, child) => acc + childrenToText(child), "");
  } else if (
    children !== null &&
    typeof children === "object" &&
    "props" in children &&
    children.props?.children
  ) {
    return childrenToText(children.props.children);
  } else if (typeof children === "string") {
    return children;
  }
  return "";
}

// Clear failed image cache on initial load
if (typeof window !== "undefined") {
  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith("failed-img:")) {
      sessionStorage.removeItem(key);
    }
  });
}

export const wrapMarkdownComponent = <T extends keyof JSX.IntrinsicElements>(
  tag: T,
  highlights: Highlight[],
  draftHighlight: NewHighlight | Highlight | null,
  selectHighlight?: (highlight: Highlight) => void,
): React.FC<MarkdownProps<T>> => {
  const allHighlights = draftHighlight
    ? [...highlights, draftHighlight]
    : highlights;

  const MarkdownComponent = ({
    node,
    children,
    ...rest
  }: MarkdownProps<T>): JSX.Element => {
    const selfRef = React.useRef<HTMLDivElement>(null);
    const startOffset = node?.position?.start?.offset ?? 0;
    const endOffset = node?.position?.end?.offset ?? 0;

    useEffect(() => {
      if (typeof window !== "undefined") {
        const keys = Object.keys(sessionStorage);
        keys.forEach((key) => {
          if (key.startsWith("failed-img:")) {
            sessionStorage.removeItem(key);
          }
        });
      }
    }, []);

    if (tag === "img") {
      const imgUrl = (rest as { src?: string }).src;
      const hasFailed =
        imgUrl && sessionStorage.getItem(`failed-img:${imgUrl}`);

      return (
        <span className="w-auto h-auto min-h-12 text-xs bg-background-400 inline-block">
          {React.createElement(
            tag,
            {
              "data-start-offset": startOffset,
              "data-end-offset": endOffset,
              src: imgUrl,
              style: {
                display: hasFailed ? "none" : undefined,
              },
              onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                target.style.height = "48px";
                target.style.display = "none";
                if (target.src) {
                  sessionStorage.setItem(`failed-img:${target.src}`, "1");
                }
              },
              ...rest,
            },
            children,
          )}
        </span>
      );
    }

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

    const isHeading =
      tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4";

    const childrenText = childrenToText(children);

    // Create base element without any highlights
    const createBaseElement = (
      elementChildren: React.ReactNode,
    ): React.ReactElement => {
      const isLink = tag === "a";
      const href = isLink ? (rest as { href?: string }).href : undefined;
      const element = React.createElement(
        tag,
        {
          "data-start-offset": startOffset,
          "data-end-offset": endOffset,
          ref: selfRef,
          ...(isLink ? { target: "_blank" } : {}),
          ...rest,
        },
        <>
          {isHeading ? (
            <ArticleHeading heading={selfRef}>{childrenText}</ArticleHeading>
          ) : null}
          {elementChildren}
        </>,
      );
      if (isLink) {
        return <LinkInfo href={href}>{element}</LinkInfo>;
      } else {
        return element;
      }
    };

    // Process text node with highlights
    const processTextNode = (
      text: string,
      currentOffset: number,
      textHighlights: (NewHighlight | Highlight)[],
    ): { processed: React.ReactNode[]; nextOffset: number } => {
      const processed: React.ReactNode[] = [];
      let pos = currentOffset;
      const textEnd = currentOffset + text.length;

      if (textHighlights.length === 0) {
        return { processed: [text], nextOffset: textEnd };
      }

      textHighlights.forEach((highlight) => {
        if (highlight.startOffset > pos) {
          processed.push(
            text.slice(
              pos - currentOffset,
              highlight.startOffset - currentOffset,
            ),
          );
        }

        const highlightEnd = Math.min(highlight.endOffset, textEnd);
        const highlightedText = text.slice(
          Math.max(0, highlight.startOffset - currentOffset),
          highlightEnd - currentOffset,
        );

        if (highlightedText) {
          processed.push(
            <HighlightSpan
              isSelected={highlight.id === draftHighlight?.id}
              key={`${highlight.startOffset}-${highlightEnd}`}
              highlight={highlight}
              startOffset={Math.max(currentOffset, highlight.startOffset)}
              endOffset={highlightEnd}
              onClick={selectHighlight}
            >
              {highlightedText}
            </HighlightSpan>,
          );
        }

        pos = highlightEnd;
      });

      if (pos < textEnd) {
        processed.push(text.slice(pos - currentOffset));
      }

      return { processed, nextOffset: textEnd };
    };

    // Process all children
    const processChildren = (): React.ReactNode[] => {
      const processed: React.ReactNode[] = [];
      let currentOffset = startOffset;

      React.Children.forEach(children, (child) => {
        if (typeof child === "string") {
          const textHighlights = allHighlights
            .filter(
              (h) =>
                h.startOffset < currentOffset + child.length &&
                h.endOffset > currentOffset,
            )
            .sort((a, b) => a.startOffset - b.startOffset);

          const { processed: processedText, nextOffset } = processTextNode(
            child,
            currentOffset,
            textHighlights,
          );
          processed.push(...processedText);
          currentOffset = nextOffset;
        } else if (React.isValidElement(child)) {
          processed.push(child);
          const childNode = child.props.node as MarkdownNode | undefined;
          currentOffset = childNode?.position?.end?.offset ?? currentOffset + 1;
        } else if (child != null) {
          processed.push(child);
        }
      });

      return processed;
    };

    // Check if entire node should be highlighted
    const containingHighlight = allHighlights.find(
      (h) => h.startOffset <= startOffset && h.endOffset >= endOffset,
    );

    // Process children first
    const processedChildren = processChildren();

    // If there's a containing highlight and this isn't already a highlighted element,
    // wrap the processed children in a highlight span
    if (containingHighlight && !React.isValidElement(children)) {
      return createBaseElement(
        <HighlightSpan
          isSelected={containingHighlight.id === draftHighlight?.id}
          highlight={containingHighlight}
          startOffset={startOffset}
          endOffset={endOffset}
          onClick={selectHighlight}
        >
          {children}
        </HighlightSpan>,
      );
    }

    // Otherwise return the processed children in the base element
    return createBaseElement(processedChildren);
  };

  return MarkdownComponent;
};
