import Markdown from "@app/components/Markdown";
import {
  type HighlightItem,
  HighlightsContext,
} from "@app/providers/Highlights";
import { TextDirection } from "@app/schemas/db";
import { cn } from "@app/utils/cn";
import React, { useContext } from "react";
import { Link } from "react-router-dom";

interface HighlightRowProps {
  highlight: HighlightItem;
}

const HighlightRow: React.FC<HighlightRowProps> = ({ highlight }) => {
  const { selectedHighlight, selectHighlight } = useContext(HighlightsContext);

  const isSelected = selectedHighlight?.id === highlight.id;
  const dir = highlight.item.metadata.textDirection;

  return (
    <div
      className="w-full group flex flex-col bg-background-400 pl-4 pr-2 py-1 rounded-sm overflow-hidden hover:bg-background-300 data-[selected=true]:bg-background-300 data-[focus=true]:outline-focus data-[focus=true]:outline"
      onClick={() => selectHighlight(isSelected ? null : highlight.id)}
      data-selected={isSelected ? true : undefined}
      data-focus={isSelected ? true : undefined}
      data-active={isSelected ? true : undefined}
      dir={dir}
    >
      <div
        className={cn(
          "text-sm mb-2 border-warning-300",
          dir === TextDirection.RTL ? "border-r pr-2" : "border-l pl-2",
        )}
      >
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
          to={`/item/${highlight.item.slug}#${highlight.id}`}
          className="underline"
        >
          {highlight.item.metadata.title}
        </Link>
      </div>
    </div>
  );
};

export default HighlightRow;
