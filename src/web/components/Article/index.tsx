import React, { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";

import { useArticleUpdate } from "./actions";
import MarkdownViewer from "./MarkdownViewer";

interface ArticleProps {
  content: string;
}

const Article: React.FC<ArticleProps> = ({ content }: ArticleProps) => {
  const { updateReadingProgress, createHighlight, deleteHighlight } =
    useArticleUpdate();
  const { loadedItem } = useContext(CurrentItemContext);

  return (
    <>
      <MarkdownViewer
        readingProgress={loadedItem?.item.metadata.readingProgress || 0}
        highlights={loadedItem?.item.highlights || []}
        onProgressChange={updateReadingProgress}
        onCreateHighlight={createHighlight}
        onDeleteHighlight={deleteHighlight}
        className="py-4"
      >
        {content}
      </MarkdownViewer>
    </>
  );
};

export default Article;
