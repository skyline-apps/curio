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

const createComponentWithOffset = <T extends keyof JSX.IntrinsicElements>(
  tag: T,
): React.FC<MarkdownProps<T>> => {
  const MarkdownComponent = ({
    node,
    children,
    ...rest
  }: MarkdownProps<T>): JSX.Element => {
    const startOffset = node?.position?.start?.offset;
    const endOffset = node?.position?.end?.offset;
    return React.createElement(
      tag,
      {
        "data-start-offset": startOffset,
        "data-end-offset": endOffset,
        ...rest,
      },
      children,
    );
  };
  return MarkdownComponent;
};

const components = {
  h1: createComponentWithOffset("h1"),
  h2: createComponentWithOffset("h2"),
  h3: createComponentWithOffset("h3"),
  h4: createComponentWithOffset("h4"),
  h5: createComponentWithOffset("h5"),
  h6: createComponentWithOffset("h6"),
  p: createComponentWithOffset("p"),
  ul: createComponentWithOffset("ul"),
  ol: createComponentWithOffset("ol"),
  li: createComponentWithOffset("li"),
  blockquote: createComponentWithOffset("blockquote"),
  code: createComponentWithOffset("code"),
  pre: createComponentWithOffset("pre"),
  em: createComponentWithOffset("em"),
  strong: createComponentWithOffset("strong"),
  a: createComponentWithOffset("a"),
  img: createComponentWithOffset("img"),
  del: createComponentWithOffset("del"),
  hr: createComponentWithOffset("hr"),
  table: createComponentWithOffset("table"),
  thead: createComponentWithOffset("thead"),
  tbody: createComponentWithOffset("tbody"),
  tr: createComponentWithOffset("tr"),
  td: createComponentWithOffset("td"),
  th: createComponentWithOffset("th"),
} as Components;

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

  return (
    <div
      ref={contentRef}
      className={cn(
        "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:!text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children || ""}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
