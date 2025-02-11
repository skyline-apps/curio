import React from "react";
import { createPortal } from "react-dom";

import { type NewHighlight } from "@/app/api/v1/items/highlights/validation";
import Button from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";

interface SelectionTooltipProps {
  selection: Selection;
  highlight: NewHighlight;
  onSave: (highlight: NewHighlight) => Promise<void>;
  addNote: (highlight: NewHighlight) => Promise<void>;
}

export const SelectionTooltip = ({
  selection,
  highlight,
  onSave,
  addNote,
}: SelectionTooltipProps): React.ReactElement | null => {
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!range || range.collapsed) return null;

  const rect = range.getBoundingClientRect();
  const key = `${rect.top}-${rect.left}-${rect.width}-${rect.height}`;

  return createPortal(
    <Popover defaultOpen key={key}>
      <PopoverTrigger>
        <div
          className="fixed -translate-x-1/2"
          style={{
            top: rect.top,
            left: rect.left + rect.width / 2,
            width: 0,
            height: 0,
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="z-50">
        <div className="flex items-center gap-2">
          <Button size="xs" onPress={() => onSave(highlight)}>
            Save
          </Button>
          <Button size="xs" variant="flat" onPress={() => addNote(highlight)}>
            Add note
          </Button>
        </div>
      </PopoverContent>
    </Popover>,
    document.body,
  );
};
