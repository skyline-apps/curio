"use client";

import React, { useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import { Chip, COLOR_PALETTE } from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";

export interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelsProps {
  labels: Label[];
  loading?: boolean;
  onAdd?: (label: { name: string; color: string }) => Promise<void>;
  onDelete?: (labelId: string) => Promise<void>;
  onRename?: (
    labelId: string,
    updates: { name?: string; color?: string },
  ) => Promise<void>;
}

const Labels: React.FC<LabelsProps> = ({
  labels,
  loading = false,
  onAdd,
  onDelete,
  onRename,
}) => {
  const [draftLabel, setDraftLabel] = useState<{
    name: string;
    color: string;
  } | null>(null);

  const handleUpdateLabelName = async (
    labelId: string,
    newName: string,
    newColor?: string,
  ): Promise<void> => {
    const currentLabel = labels?.find((label) => label.id === labelId);

    if (
      currentLabel?.name === newName.trim() &&
      (!newColor || currentLabel.color === newColor)
    ) {
      return;
    }

    const updates: { name?: string; color?: string } = {};
    if (newName.trim() !== currentLabel?.name) {
      updates.name = newName.trim();
    }
    if (newColor && newColor !== currentLabel?.color) {
      updates.color = newColor;
    }

    if (Object.keys(updates).length > 0 && onRename) {
      await onRename(labelId, updates);
    }
  };

  const handleDeleteLabel = async (labelId: string): Promise<void> => {
    if (onDelete) {
      await onDelete(labelId);
    }
  };

  const addDraftLabel = (): void => {
    if (!draftLabel) {
      const randomColor =
        COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      setDraftLabel({ name: "", color: randomColor });
    }
  };

  const handleDraftLabelSave = async (
    newName: string,
    newColor?: string,
  ): Promise<void> => {
    if (!newName.trim()) {
      setDraftLabel(null);
      return;
    }

    if (onAdd) {
      await onAdd({
        name: newName.trim(),
        color: newColor || draftLabel?.color || COLOR_PALETTE[0],
      });
      setDraftLabel(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.length === 0 && !draftLabel && (
        <p className="text-secondary-800 text-sm">No labels yet.</p>
      )}
      {labels.map((label) => (
        <Chip
          key={label.id}
          color={label.color}
          editable={!!onRename}
          onEdit={(newName, newColor) =>
            handleUpdateLabelName(label.id, newName, newColor)
          }
          onDelete={onDelete ? () => handleDeleteLabel(label.id) : undefined}
          value={label.name}
        />
      ))}

      {draftLabel && (
        <Chip
          key="draft"
          color={draftLabel.color}
          editable
          defaultActive
          onEdit={(newName, newColor) =>
            handleDraftLabelSave(newName, newColor)
          }
          onBlur={() => {
            if (!draftLabel.name.trim()) {
              setDraftLabel(null);
            }
          }}
          value={draftLabel.name}
        />
      )}
      {loading && <Spinner size="sm" />}

      {!draftLabel && onAdd && (
        <Button isIconOnly onPress={addDraftLabel} size="xs">
          <Icon icon={<HiOutlinePlus />} />
        </Button>
      )}
    </div>
  );
};

export default Labels;
