import { useEffect, useState } from "react";
import { HiOutlineClipboard, HiOutlineTrash } from "react-icons/hi2";

import { Highlight } from "@/app/api/v1/items/highlights/validation";
import Markdown from "@/components/Markdown";
import { ItemTitle, ItemUrl } from "@/components/RightSidebar/ItemMetadata";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { TextDirection } from "@/db/schema";
import { type HighlightItem } from "@/providers/HighlightsProvider";
import { cn } from "@/utils/cn";

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
    <div className="flex flex-col gap-2 p-4 h-full">
      {"item" in highlight && (
        <div dir={textDirection}>
          <ItemTitle title={highlight.item.metadata.title} slug={itemSlug} />
          <ItemUrl
            url={highlight.item.url}
            title={highlight.item.metadata.title}
          />
        </div>
      )}
      <div
        dir={textDirection}
        className={cn(
          "border-warning-300",
          textDirection === TextDirection.RTL
            ? "border-r pr-2"
            : "border-l pl-2",
        )}
      >
        <Markdown className="[&_*]:text-sm overflow-y-auto">
          {highlight.text}
        </Markdown>
      </div>

      <div
        className="flex flex-row justify-end gap-2 shrink-0"
        dir={textDirection}
      >
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
        className="max-w-xs shrink-0"
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
