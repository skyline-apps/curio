import {
  Autocomplete,
  AutocompleteItem,
} from "@app/components/ui/Autocomplete";
import Button from "@app/components/ui/Button";
import { Chip } from "@app/components/ui/Chip";
import Icon from "@app/components/ui/Icon";
import type { Label } from "@app/schemas/v1/user/labels";
import { brown } from "@app/utils/colors";
import React, { Key, useMemo, useRef, useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

interface LabelPickerProps {
  labels: Label[];
  availableLabels: Label[];
  onAdd: (label: Label) => void | Promise<void>;
  onCreate?: (name: string) => Promise<Label | void>;
  onDelete?: (labelId: string) => void | Promise<void>;
}

const LabelPicker: React.FC<LabelPickerProps> = ({
  labels,
  availableLabels,
  onAdd,
  onCreate,
  onDelete,
}) => {
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const unusedLabels = useMemo(() => {
    const usedIds = new Set(labels.map((l) => l.id));
    const remainingLabels: Label[] = availableLabels.filter(
      (l) => !usedIds.has(l.id),
    );
    if (inputValue && !!onCreate) {
      remainingLabels.push({
        id: "",
        name: inputValue,
        color: brown[600],
      });
    }
    return remainingLabels;
  }, [labels, inputValue, availableLabels, onCreate]);

  const handleSelectionChange = async (key: Key | null): Promise<void> => {
    const selectedLabel = unusedLabels.find((l) => l.id === key);
    if (selectedLabel) {
      setIsLoading(true);
      try {
        if (selectedLabel.id) {
          await onAdd(selectedLabel);
        } else if (!!onCreate) {
          const newLabel = await onCreate(selectedLabel.name);
          if (!newLabel) {
            return;
          }
          await onAdd(newLabel);
        }
      } finally {
        setIsLoading(false);
        setShowAutocomplete(false);
        setInputValue("");
        addButtonRef.current?.focus();
      }
    }
  };

  const handleDeleteLabel = async (labelId: string): Promise<void> => {
    if (onDelete) {
      await onDelete(labelId);
    }
  };

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
      {!showAutocomplete && (
        <Button
          ref={addButtonRef}
          isIconOnly
          onPress={() => {
            setShowAutocomplete(true);
          }}
          size="xs"
          isLoading={isLoading}
          tooltip="Add label"
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
          listboxProps={{
            emptyContent: availableLabels.length
              ? "No labels available"
              : "No labels yet",
          }}
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
              {!item.id ? "Create " : ""}
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
