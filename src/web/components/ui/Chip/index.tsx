import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import React, { useEffect, useRef, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import { INPUT_CLASSES } from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";
import { blue, gray, green, red, yellow } from "@/utils/colors";

export const COLOR_PALETTE = [
  red[400],
  yellow[400],
  green[400],
  blue[400],
  red[600],
  yellow[600],
  green[600],
  blue[600],
  gray[400],
  gray[600],
];

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  color?: string;
  editable?: boolean;
  defaultActive?: boolean;
  onEdit?: (newValue: string, newColor?: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onBlur?: () => void;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      value,
      color = COLOR_PALETTE[0],
      editable = false,
      defaultActive = false,
      onEdit,
      onDelete,
      onBlur,
      className,
      ...props
    },
    ref,
  ) => {
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(defaultActive);
    const [editValue, setEditValue] = useState<string>(value);
    const [editColor, setEditColor] = useState<string>(color);
    const inputRef = useRef<HTMLInputElement>(null);
    const chipContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        cancelEdit();
      }
    };

    const cancelEdit = (): void => {
      setIsEditing(false);
      setEditValue(value);
      setEditColor(color);
    };

    const handleSave = async (): Promise<void> => {
      if (editValue.trim() === "" && value === "") {
        return;
      }
      setIsUpdating(true);
      setIsEditing(false);
      if (onEdit && editValue.trim() !== "") {
        const nameChanged = editValue.trim() !== value;
        const colorChanged = editColor !== color;

        if (nameChanged || colorChanged) {
          await onEdit(editValue.trim(), colorChanged ? editColor : undefined);
        }
      }
      if (editValue.trim() === "") {
        setEditValue(value);
      }
      setIsUpdating(false);
    };

    const handleBlur = async (e: React.FocusEvent): Promise<void> => {
      const relatedTarget = e.relatedTarget;
      if (chipContainerRef.current?.contains(relatedTarget as Node)) {
        return;
      }

      onBlur?.();

      await handleSave();
    };

    const handleDeleteClick = async (
      event: React.MouseEvent,
    ): Promise<void> => {
      event.stopPropagation();
      await onDelete?.();
    };

    const selectColor = (selectedColor: string): void => {
      setEditColor(selectedColor);
    };

    if (isEditing && editable) {
      return (
        <div
          ref={chipContainerRef}
          className={cn(
            "relative rounded inline-flex items-center space-x-2 text-xs px-2 border outline-none h-6",
            isEditing ? INPUT_CLASSES : "",
            className,
          )}
          style={{
            borderColor: editColor,
            color: editColor,
          }}
        >
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            maxLength={255}
            className="flex-grow w-12 bg-transparent outline-none text-foreground"
          />
          <Popover onClose={handleSave} placement="bottom">
            <PopoverTrigger>
              <Button
                isIconOnly
                className="min-w-4 w-4 h-4"
                style={{ backgroundColor: editColor }}
              />
            </PopoverTrigger>
            <PopoverContent>
              <div
                className="flex space-x-1 p-2"
                onMouseDown={(e) => e.preventDefault()}
              >
                {COLOR_PALETTE.map((paletteColor) => (
                  <button
                    key={paletteColor}
                    onClick={() => selectColor(paletteColor)}
                    className={cn(
                      "w-6 h-6 rounded",
                      editColor === paletteColor &&
                        "border-2 border-foreground",
                    )}
                    style={{
                      backgroundColor: paletteColor,
                    }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          "rounded inline-flex items-center justify-center text-xs px-2 py-1 text-default-15 cursor-default group truncate",
          editable && "cursor-pointer hover:opacity-80",
          className,
        )}
        style={{
          backgroundColor: color,
        }}
        onClick={
          editable
            ? () => {
                setIsEditing(true);
                inputRef.current?.focus();
              }
            : undefined
        }
      >
        {isUpdating ? <Spinner size="xs" className="text-foreground" /> : value}
        {onDelete && (
          <button
            data-testid="delete-button"
            onClick={handleDeleteClick}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity rounded"
          >
            <HiOutlineXMark size={16} />
          </button>
        )}
      </div>
    );
  },
);

Chip.displayName = "Chip";
