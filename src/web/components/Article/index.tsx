import React, { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";

import { useArticleUpdate } from "./actions";
import MarkdownViewer from "./MarkdownViewer";

interface ArticleProps {
  content: string;
}

const Article: React.FC<ArticleProps> = ({ content }: ArticleProps) => {
  const { updateReadingProgress } = useArticleUpdate();
  const { loadedItem } = useContext(CurrentItemContext);

  return (
    <>
      <MarkdownViewer
        readingProgress={loadedItem?.item.metadata.readingProgress || 0}
        onProgressChange={updateReadingProgress}
        className="py-4"
      >
        {content}
      </MarkdownViewer>
    </>
  );
};

export default Article;
