"use client";
import Link from "next/link";
import React, { useContext } from "react";

import Markdown from "@/components/Markdown";
import {
  type HighlightItem,
  HighlightsContext,
} from "@/providers/HighlightsProvider";

interface HighlightRowProps {
  highlight: HighlightItem;
}

const HighlightRow: React.FC<HighlightRowProps> = ({ highlight }) => {
  const { selectedHighlight, selectHighlight } = useContext(HighlightsContext);

  const isSelected = selectedHighlight?.id === highlight.id;

  return (
    <div
      className="w-full group flex flex-col bg-background-400 pl-4 pr-2 py-1 rounded-sm overflow-hidden hover:bg-background-300 data-[selected=true]:bg-background-300 data-[focus=true]:outline-focus data-[focus=true]:outline"
      onClick={() => selectHighlight(isSelected ? null : highlight.id)}
      data-selected={isSelected ? true : undefined}
      data-focus={isSelected ? true : undefined}
      data-active={isSelected ? true : undefined}
    >
      <div className="text-sm mb-2 border-l border-warning-300 pl-2">
        {highlight.textExcerpt ? (
          <Markdown
            className="[&_*]:text-sm [&_*]:my-0 text-wrap truncate"
            components={{
              strong: ({ children }) => (
                <strong className="!text-foreground">{children}</strong>
              ),
            }}
          >
            {highlight.textExcerpt}
          </Markdown>
        ) : (
          highlight.text
        )}
      </div>
      {highlight.noteExcerpt ? (
        <Markdown
          className=" [&_*]:text-xs [&_*]:my-0 text-wrap truncate"
          components={{
            strong: ({ children }) => (
              <strong className="!text-foreground">{children}</strong>
            ),
          }}
        >
          {highlight.noteExcerpt}
        </Markdown>
      ) : highlight.note ? (
        <div className="text-xs">{highlight.note}</div>
      ) : null}
      <div className="self-end text-xs text-secondary italic">
        <Link
          prefetch={false}
          href={`/item/${highlight.item.slug}`}
          className="underline"
        >
          {highlight.item.metadata.title}
        </Link>
      </div>
    </div>
  );
};

export default HighlightRow;
