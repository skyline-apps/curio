import { type Highlight } from "@web/app/api/v1/items/highlights/validation";
import Button from "@web/components/ui/Button";
import { Tooltip } from "@web/components/ui/Tooltip";
import { BrowserMessageContext } from "@web/providers/BrowserMessageProvider";
import { UserContext } from "@web/providers/UserProvider";
import slugify from "limax";
import React, {
  type ComponentPropsWithoutRef,
  useContext,
  useEffect,
} from "react";

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
  href: string;
}

const LinkInfo: React.FC<LinkInfoProps> = ({
  children,
  href,
}: LinkInfoProps) => {
  const { user } = useContext(UserContext);
  const { saveItemContent } = useContext(BrowserMessageContext);

  return (
    <Tooltip
      content={
        <span className="flex items-center gap-1 justify-between max-w-60 p-1 overflow-x-hidden select-none">
          <a
            href={href}
            target="_blank"
            className="underline text-xs truncate text-ellipsis"
          >
            {`${new URL(href).hostname}${new URL(href).pathname}`}
          </a>
          {user.id && (
            <Button
              className="shrink-0"
              size="xs"
              color="primary"
              onPress={() => href && saveItemContent(href)}
            >
              Save to Curio
            </Button>
          )}
        </span>
      }
    >
      {children}
    </Tooltip>
  );
};

export function removeHighlightsOverlap(highlights: Highlight[]): Highlight[] {
  if (highlights.length <= 1) return highlights;

  // Sort highlights by start offset for efficient processing
  const sortedHighlights = [...highlights].sort(
    (a, b) => a.startOffset - b.startOffset,
  );
  const resultHighlights: Highlight[] = [];

  let current = sortedHighlights[0];

  // Process each highlight in order
  for (let i = 1; i < sortedHighlights.length; i++) {
    const next = sortedHighlights[i];

    if (current.endOffset <= next.startOffset) {
      // No overlap - add current and move to next
      resultHighlights.push(current);
      current = next;
    } else if (current.endOffset >= next.endOffset) {
      // Next is completely contained within current - skip next
      continue;
    } else {
      // Partial overlap - truncate current highlight and add both
      resultHighlights.push({
        ...current,
        endOffset: next.startOffset,
      });
      current = next;
    }
  }

  // Add the last processed highlight
  resultHighlights.push(current);

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
  selectedHighlight: Highlight | null,
  selectHighlight?: (highlight: Highlight) => void,
): React.FC<MarkdownProps<T>> => {
  const allHighlights: Highlight[] = highlights;

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
      let isUrl;
      try {
        new URL(href!);
        isUrl = true;
      } catch (error) {
        isUrl = false;
      }

      const anchor = isHeading ? slugify(childrenText) : "";

      const element = React.createElement(
        tag,
        {
          "data-start-offset": startOffset,
          "data-end-offset": endOffset,
          ref: selfRef,
          ...rest,
          // Open links in new tab
          ...(isUrl ? { target: "_blank" } : {}),
          // Add anchors to headings
          ...(isHeading ? { id: anchor } : {}),
          // Ignore existing anchor links
          ...(href?.startsWith("#") ? { href: undefined } : { href }),
        },
        <>
          {isHeading ? (
            <ArticleHeading anchor={anchor}>{childrenText}</ArticleHeading>
          ) : null}
          {elementChildren}
        </>,
      );
      if (isLink && href && isUrl) {
        return <LinkInfo href={href}>{element}</LinkInfo>;
      } else {
        return element;
      }
    };

    // Process text node with highlights
    const processTextNode = (
      text: string,
      currentOffset: number,
      textHighlights: Highlight[],
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
              id={
                // Only set highlight id if this is the first span for the highlight
                pos <= highlight.startOffset && highlight.startOffset < textEnd
                  ? highlight.id
                  : ""
              }
              isSelected={highlight.id === selectedHighlight?.id}
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
          id={
            containingHighlight.startOffset === startOffset
              ? containingHighlight.id
              : ""
          }
          isSelected={containingHighlight.id === selectedHighlight?.id}
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
