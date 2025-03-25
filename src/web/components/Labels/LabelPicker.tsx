"use client";

import {
  Autocomplete,
  AutocompleteItem,
} from "@web/components/ui/Autocomplete";
import Button from "@web/components/ui/Button";
import { Chip } from "@web/components/ui/Chip";
import Icon from "@web/components/ui/Icon";
import React, { Key, useMemo, useRef, useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

import { Label } from ".";

interface LabelPickerProps {
  labels: Label[];
  availableLabels: Label[];
  onAdd: (label: Label) => void | Promise<void>;
  onDelete?: (labelId: string) => void | Promise<void>;
}

const LabelPicker: React.FC<LabelPickerProps> = ({
  labels,
  availableLabels,
  onAdd,
  onDelete,
}) => {
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const unusedLabels = useMemo(() => {
    const usedIds = new Set(labels.map((l) => l.id));
    return availableLabels.filter((l) => !usedIds.has(l.id));
  }, [labels, availableLabels]);

  const handleSelectionChange = async (key: Key | null): Promise<void> => {
    const selectedLabel = unusedLabels.find((l) => l.id === key);
    if (selectedLabel) {
      setIsLoading(true);
      await onAdd(selectedLabel);
      setShowAutocomplete(false);
      setIsLoading(false);
      setInputValue("");
      addButtonRef.current?.focus();
    }
  };

  const handleDeleteLabel = async (labelId: string): Promise<void> => {
    if (onDelete) {
      await onDelete(labelId);
    }
  };

  const noLabelsDefined = availableLabels.length === 0;
  const hasLabelsRemaining = unusedLabels.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((label) => (
        <Chip
          key={label.id}
          color={label.color}
          onDelete={onDelete ? () => handleDeleteLabel(label.id) : undefined}
          value={label.name}
        />
      ))}
      {((!showAutocomplete && hasLabelsRemaining) || noLabelsDefined) && (
        <Button
          ref={addButtonRef}
          isIconOnly
          onPress={() => {
            if (hasLabelsRemaining) {
              setShowAutocomplete(true);
            }
          }}
          size="xs"
          isLoading={isLoading}
          disabled={!hasLabelsRemaining}
          tooltip={noLabelsDefined ? "Define labels in Settings" : "Add label"}
        >
          <Icon icon={<HiOutlinePlus />} />
        </Button>
      )}
      {showAutocomplete && (
        <Autocomplete<Label>
          aria-label="Search labels"
          defaultItems={unusedLabels}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSelectionChange={handleSelectionChange}
          size="sm"
          variant="flat"
          autoFocus
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setShowAutocomplete(false);
              setInputValue("");
            }
          }}
          placeholder="Search labels..."
        >
          {(item) => (
            <AutocompleteItem
              key={item.id}
              className="text-xs"
              textValue={item.name}
            >
              <Chip
                className="pointer-events-none"
                color={item.color}
                value={item.name}
              />
            </AutocompleteItem>
          )}
        </Autocomplete>
      )}
    </div>
  );
};

export default LabelPicker;
