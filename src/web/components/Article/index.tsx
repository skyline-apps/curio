import React, { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { cn } from "@/utils/cn";

import { useArticleUpdate } from "./actions";
import { ItemActionShortcuts } from "./ItemActionShortcuts";
import MarkdownViewer from "./MarkdownViewer";

interface ArticleProps {
  content: string;
  className?: string;
}

const Article: React.FC<ArticleProps> = ({
  content,
  className,
}: ArticleProps) => {
  const { updateReadingProgress } = useArticleUpdate();
  const { loadedItem, isEditable } = useContext(CurrentItemContext);

  const highlights =
    loadedItem?.item && "highlights" in loadedItem?.item
      ? loadedItem?.item.highlights || []
      : [];

  return (
    <>
      <ItemActionShortcuts />
      <MarkdownViewer
        readingProgress={
          isEditable(loadedItem?.item)
            ? loadedItem?.item.metadata.readingProgress || 0
            : 0
        }
        highlights={highlights}
        onProgressChange={
          isEditable(loadedItem?.item) ? updateReadingProgress : undefined
        }
        className={cn("py-4", className)}
      >
        {content}
      </MarkdownViewer>
    </>
  );
};

export default Article;
