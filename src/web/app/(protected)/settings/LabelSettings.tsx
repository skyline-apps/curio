"use client";

import React, { useContext, useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import { Chip, COLOR_PALETTE } from "@/components/ui/Chip";
import { FormSection } from "@/components/ui/Form";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";
import { SettingsContext } from "@/providers/SettingsProvider";
import { createLogger } from "@/utils/logger";

const log = createLogger("LabelSettings");

const LabelSettings: React.FC = () => {
  const { labels, loadingLabels, createLabel, updateLabel, deleteLabel } =
    useContext(SettingsContext);

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

    try {
      const updates: { name?: string; color?: string } = {};
      if (newName.trim() !== currentLabel?.name) {
        updates.name = newName.trim();
      }
      if (newColor && newColor !== currentLabel?.color) {
        updates.color = newColor;
      }

      if (Object.keys(updates).length > 0) {
        await updateLabel(labelId, updates);
      }
    } catch (error) {
      log.error("Unexpected error in label update", error);
    }
  };

  const handleDeleteLabel = async (labelId: string): Promise<void> => {
    try {
      await deleteLabel(labelId);
    } catch (error) {
      log.error("Unexpected error in label deletion", error);
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

    try {
      const created = await createLabel({
        name: newName.trim(),
        color: newColor || draftLabel?.color || COLOR_PALETTE[0],
      });

      if (created) {
        setDraftLabel(null);
      }
    } catch (error) {
      log.error("Unexpected error in draft label creation", error);
    }
  };

  return (
    <div className="space-y-4">
      <FormSection title="Labels" description="Manage item labels">
        {!labels ? null : (
          <div className="flex flex-wrap items-center gap-2">
            {labels.length === 0 && !draftLabel && (
              <p className="text-secondary-800 text-sm">No labels yet.</p>
            )}
            {labels.map((label) => (
              <Chip
                key={label.id}
                color={label.color}
                editable
                onEdit={(newName, newColor) =>
                  handleUpdateLabelName(label.id, newName, newColor)
                }
                onDelete={() => handleDeleteLabel(label.id)}
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
            {loadingLabels && <Spinner size="sm" />}

            {!draftLabel && (
              <Button isIconOnly onPress={addDraftLabel} size="sm">
                <Icon icon={<HiOutlinePlus />} />
              </Button>
            )}
          </div>
        )}
      </FormSection>
    </div>
  );
};

export default LabelSettings;
