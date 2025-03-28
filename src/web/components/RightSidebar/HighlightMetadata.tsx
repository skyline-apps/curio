import { Highlight } from "@web/app/api/v1/items/highlights/validation";
import Markdown from "@web/components/Markdown";
import { ItemTitle, ItemUrl } from "@web/components/RightSidebar/ItemMetadata";
import Button from "@web/components/ui/Button";
import Textarea from "@web/components/ui/Textarea";
import { TextDirection } from "@web/db/schema";
import { type HighlightItem } from "@web/providers/HighlightsProvider";
import { cn } from "@web/utils/cn";
import { useEffect, useState } from "react";
import { HiOutlineClipboard, HiOutlineTrash } from "react-icons/hi2";

import { useHighlightUpdate } from "./highlightActions";

interface HighlightMetadataProps {
  highlight: Highlight | HighlightItem;
  itemSlug: string;
  textDirection: TextDirection;
  onUpdate?: (highlight: Highlight | null) => void;
}

const HighlightMetadata: React.FC<HighlightMetadataProps> = ({
  highlight,
  itemSlug,
  textDirection,
  onUpdate,
}: HighlightMetadataProps): React.ReactElement => {
  const { isDeleting, updateHighlightNote, deleteHighlight } =
    useHighlightUpdate({
      currentHighlight: highlight,
      itemSlug,
      onUpdate,
    });

  const [draftNote, setDraftNote] = useState<string>("");

  useEffect(() => {
    setDraftNote(highlight.note || "");
  }, [highlight.note]);

  return (
    <div className="flex flex-col gap-2 p-4 h-full" dir={textDirection}>
      {"item" in highlight && (
        <>
          <ItemTitle
            title={highlight.item.metadata.title}
            slug={itemSlug}
            anchor={highlight.id}
          />
          <ItemUrl
            url={highlight.item.url}
            title={highlight.item.metadata.title}
          />
        </>
      )}
      <div
        className={cn(
          "border-warning-300 overflow-y-auto",
          textDirection === TextDirection.RTL
            ? "border-r pr-2"
            : "border-l pl-2",
        )}
      >
        <Markdown className="[&_*]:text-sm">{highlight.text}</Markdown>
      </div>

      <div className="flex flex-row justify-end gap-2 shrink-0">
        <Button
          isIconOnly
          tooltip="Copy highlight text"
          size="sm"
          variant="faded"
          onPress={() => navigator.clipboard.writeText(highlight.text || "")}
        >
          <HiOutlineClipboard />
        </Button>
        <Button
          isIconOnly
          tooltip="Delete highlight"
          size="sm"
          onPress={deleteHighlight}
          isLoading={isDeleting}
          color="danger"
          variant="light"
        >
          <HiOutlineTrash />
        </Button>
      </div>
      <Textarea
        classNames={{
          base: "max-w-xs shrink-0",
        }}
        value={draftNote}
        onValueChange={(note) => setDraftNote(note)}
        label="Note"
        variant="faded"
        onClear={() => setDraftNote("")}
        onSave={async () => {
          await updateHighlightNote(draftNote);
        }}
      />
    </div>
  );
};

export default HighlightMetadata;
