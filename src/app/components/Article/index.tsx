import Spinner from "@app/components/ui/Spinner";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { cn } from "@app/utils/cn";
import React, { useContext, useMemo } from "react";

import { ItemActionShortcuts } from "./ItemActionShortcuts";
import MarkdownViewer from "./MarkdownViewer";
import ScrollProgressTracker from "./ScrollProgressTracker";

interface ArticleProps {
  content: string;
  className?: string;
}

const Article: React.FC<ArticleProps> = React.memo(
  ({ content, className }: ArticleProps) => {
    const { loadedItem, isEditable, viewingSummary, itemSummaryLoading } =
      useContext(CurrentItemContext);

    // Extract only the highlights and item ID to prevent re-renders from metadata changes
    const itemId = loadedItem?.item.id;
    const itemHighlights =
      loadedItem?.item && "highlights" in loadedItem.item
        ? loadedItem.item.highlights
        : null;

    const highlights = useMemo(() => itemHighlights || [], [itemHighlights]);

    // Extract editable status directly to prevent re-renders from metadata changes
    const isEditableValue = useMemo(
      () => isEditable(loadedItem?.item),
      [isEditable, itemId], // eslint-disable-line react-hooks/exhaustive-deps
    );

    // Memoize the viewer to prevent re-renders from scroll updates
    const viewer = useMemo(
      () => (
        <MarkdownViewer
          highlights={highlights}
          className={cn("py-4", className)}
          isEditable={isEditableValue && !viewingSummary}
        >
          {content}
        </MarkdownViewer>
      ),
      [highlights, className, isEditableValue, content, viewingSummary],
    );

    return (
      <>
        <ItemActionShortcuts />
        <ScrollProgressTracker />
        {viewer}
        {itemSummaryLoading && (
          <div className="w-full flex justify-center items-center mb-8">
            <Spinner variant="wave" size="sm" />
          </div>
        )}
      </>
    );
  },
);

Article.displayName = "Article";
export default Article;
