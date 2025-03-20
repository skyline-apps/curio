import React, { useContext } from "react";

import { useAppPage } from "@/providers/AppPageProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { cn } from "@/utils/cn";

import { useArticleUpdate } from "./actions";
import { ItemActionShortcuts } from "./ItemActionShortcuts";
import MarkdownViewer from "./MarkdownViewer";
import ScrollProgressTracker from "./ScrollProgressTracker";

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
  const { containerRef } = useAppPage();

  const highlights =
    loadedItem?.item && "highlights" in loadedItem?.item
      ? loadedItem?.item.highlights || []
      : [];

  const readingProgress = isEditable(loadedItem?.item)
    ? loadedItem?.item.metadata.readingProgress || 0
    : 0;

  const progressChangeHandler = isEditable(loadedItem?.item)
    ? updateReadingProgress
    : undefined;

  return (
    <>
      <ItemActionShortcuts />
      {/* Progress tracker is separate from the content renderer */}
      {progressChangeHandler && (
        <ScrollProgressTracker
          initialProgress={readingProgress}
          containerRef={containerRef}
          onProgressChange={progressChangeHandler}
        />
      )}
      <MarkdownViewer
        highlights={highlights}
        className={cn("py-4", className)}
        isEditable={isEditable(loadedItem?.item)}
      >
        {content}
      </MarkdownViewer>
    </>
  );
};

export default Article;
