import { useContext, useState } from "react";

import Markdown from "@/components/Markdown";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";

import { isHighlightWithId, useRightSidebarUpdate } from "./actions";

const HighlightMetadata: React.FC = (): React.ReactElement => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { draftHighlight, updateDraftHighlightNote } =
    useContext(CurrentItemContext);
  const { isDeleting, isUpdating, createOrUpdateHighlight, deleteHighlight } =
    useRightSidebarUpdate();

  const components = {
    p: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLParagraphElement>>) => (
      <p className="text-sm line-clamp-4 ellipsis" {...props}>
        <span className="bg-warning dark:text-default-950">{children}</span>
      </p>
    ),
  };

  return (
    <div className="flex flex-col gap-2 p-4 h-full">
      <Markdown className="h-20 overflow-y-hidden" components={components}>
        {draftHighlight?.text}
      </Markdown>

      {isEditing ? (
        <Textarea
          className="max-w-xs"
          value={draftHighlight?.note || ""}
          onValueChange={(note) => updateDraftHighlightNote(note)}
          label="Note"
          variant="faded"
          onClear={() => updateDraftHighlightNote("")}
        />
      ) : (
        <p className="text-sm text-secondary overflow-auto">
          {draftHighlight?.note}
        </p>
      )}

      <div className="flex flex-row gap-2">
        {!isEditing ? (
          <Button size="sm" onPress={() => setIsEditing(true)}>
            {draftHighlight?.note ? "Edit note" : "Add note"}
          </Button>
        ) : null}
        {isHighlightWithId(draftHighlight) ? (
          <>
            {isEditing && (
              <Button
                size="sm"
                onPress={createOrUpdateHighlight}
                isLoading={isUpdating}
                color="success"
              >
                Save highlight
              </Button>
            )}
            <Button
              size="sm"
              onPress={deleteHighlight}
              isLoading={isDeleting}
              color="danger"
              variant="light"
            >
              Delete highlight
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onPress={createOrUpdateHighlight}
            isLoading={isUpdating}
            color="success"
          >
            Save highlight
          </Button>
        )}
      </div>
    </div>
  );
};

export default HighlightMetadata;
