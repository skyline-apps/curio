import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import Button from "@/components/ui/Button";

interface SelectionTooltipProps {
  highlight: NewHighlight | Highlight;
  onSave: (highlight: NewHighlight | Highlight) => Promise<void>;
  onDelete: (highlight: Highlight) => Promise<void>;
  spanRef: React.RefObject<HTMLSpanElement>;
}

export const isHighlightWithId = (
  highlight: Highlight | NewHighlight,
): highlight is Highlight => "id" in highlight;

const SelectionTooltip = ({
  highlight,
  onSave,
  onDelete,
  spanRef,
}: SelectionTooltipProps): React.ReactElement | null => {
  const [topPosition, setTopPosition] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const key = highlight.id || `${highlight.startOffset}-${highlight.endOffset}`;
  useEffect(() => {
    setTopPosition(spanRef.current?.offsetTop || 0);
  }, [spanRef.current]);

  return createPortal(
    <div
      key={key}
      className="absolute flex items-center gap-2 p-2 bg-background-300 rounded"
      style={{ top: topPosition }}
    >
      {isHighlightWithId(highlight) ? (
        <Button
          size="xs"
          onPress={() => {
            onDelete(highlight);
          }}
        >
          Delete
        </Button>
      ) : (
        <Button
          size="xs"
          onPress={async () => {
            setIsSaving(true);
            try {
              await onSave(highlight);
            } finally {
              setIsSaving(false);
            }
          }}
          isLoading={isSaving}
        >
          Save
        </Button>
      )}
      <Button
        size="xs"
        variant="flat"
        onPress={() => onSave({ ...highlight, note: "" })}
      >
        Add note
      </Button>
    </div>,
    document.getElementById("tooltip-container") || document.body,
  );
};

export default SelectionTooltip;
