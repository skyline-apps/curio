import React, { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";

import { useArticleUpdate } from "./actions";
import { ItemActionShortcuts } from "./ItemActionShortcuts";
import MarkdownViewer from "./MarkdownViewer";

interface ArticleProps {
  content: string;
}

const Article: React.FC<ArticleProps> = ({ content }: ArticleProps) => {
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
        className="py-4"
      >
        {content}
      </MarkdownViewer>
    </>
  );
};

export default Article;
