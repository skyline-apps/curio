import { useContext, useState } from "react";
import { HiOutlineClipboard, HiOutlineTrash } from "react-icons/hi2";

import Markdown from "@/components/Markdown";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";

import { useHighlightUpdate } from "./highlightActions";

const HighlightMetadata: React.FC = (): React.ReactElement => {
  const { selectedHighlight } = useContext(CurrentItemContext);
  const { isDeleting, updateHighlightNote, deleteHighlight } =
    useHighlightUpdate();
  const [draftNote, setDraftNote] = useState<string>(
    selectedHighlight?.note || "",
  );

  const components = {
    p: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLParagraphElement>>) => (
      <p className="text-sm line-clamp-4 ellipsis leading-6 my-1" {...props}>
        <span className="bg-warning dark:text-default-950">{children}</span>
      </p>
    ),
  };

  return (
    <div className="flex flex-col gap-2 p-4 h-full">
      <Markdown className="h-24 overflow-y-hidden" components={components}>
        {selectedHighlight?.text}
      </Markdown>

      <div className="flex flex-row justify-end gap-2">
        <>
          <Button
            isIconOnly
            tooltip="Copy highlight text"
            size="sm"
            variant="faded"
            onPress={() =>
              navigator.clipboard.writeText(selectedHighlight?.text || "")
            }
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
        </>
      </div>
      <Textarea
        className="max-w-xs"
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
