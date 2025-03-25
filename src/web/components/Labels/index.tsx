"use client";

import Button from "@web/components/ui/Button";
import { Chip, COLOR_PALETTE } from "@web/components/ui/Chip";
import Icon from "@web/components/ui/Icon";
import Spinner from "@web/components/ui/Spinner";
import { Tooltip } from "@web/components/ui/Tooltip";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlinePlus, HiOutlineTag } from "react-icons/hi2";

import LabelPicker from "./LabelPicker";

export interface Label {
  id: string;
  name: string;
  color: string;
}

interface BaseLabelsProps {
  labels: Label[];
  loading?: boolean;
  onDelete?: (labelId: string) => void | Promise<void>;
  onRename?: (
    labelId: string,
    updates: { name?: string; color?: string },
  ) => void | Promise<void>;
  truncate?: boolean;
}

interface CreateLabelsProps extends BaseLabelsProps {
  mode: "create";
  onAdd?: (label: { name: string; color: string }) => void | Promise<void>;
}

interface PickerLabelsProps extends BaseLabelsProps {
  mode: "picker";
  availableLabels: Label[];
  onAdd: (label: Label) => void | Promise<void>;
}

interface ViewLabelsProps extends BaseLabelsProps {
  mode: "view";
}

type LabelsProps = CreateLabelsProps | PickerLabelsProps | ViewLabelsProps;

const Labels: React.FC<LabelsProps> = (props) => {
  const [draftLabel, setDraftLabel] = useState<{
    name: string;
    color: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [showCount, setShowCount] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  const handleUpdateLabelName = async (
    labelId: string,
    newName: string,
    newColor?: string,
  ): Promise<void> => {
    const currentLabel = props.labels?.find((label) => label.id === labelId);

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

    if (Object.keys(updates).length > 0 && props.onRename) {
      await props.onRename(labelId, updates);
    }
  };

  const handleDeleteLabel = async (labelId: string): Promise<void> => {
    if (props.onDelete) {
      await props.onDelete(labelId);
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

    if ((!props.mode || props.mode === "create") && props.onAdd) {
      await props.onAdd({
        name: newName.trim(),
        color: newColor || draftLabel?.color || COLOR_PALETTE[0],
      });
      setDraftLabel(null);
    }
  };

  const checkFit = useCallback(() => {
    if (
      !props.truncate ||
      !containerRef.current ||
      !measureRef.current ||
      props.labels.length === 0
    ) {
      setShowCount(false);
      return;
    }

    const container = containerRef.current;
    const measureContainer = measureRef.current;
    const labelsContainer = measureContainer.querySelector(
      ".labels-container",
    ) as HTMLElement;

    if (!labelsContainer) return;

    const containerWidth = container.offsetWidth;
    const labelsWidth = labelsContainer.scrollWidth;
    const totalWidth = labelsWidth + (props.labels.length - 1) * 8;

    setShowCount(totalWidth > containerWidth);
  }, [props.truncate, props.labels.length]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkFit);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [checkFit, isReady]);

  useEffect(() => {
    if (!isReady) return;
    requestAnimationFrame(checkFit);
  }, [checkFit, props.labels, isReady]);

  if (props.mode === "picker") {
    return (
      <LabelPicker
        availableLabels={props.availableLabels}
        labels={props.labels}
        onAdd={props.onAdd}
        onDelete={props.onDelete}
      />
    );
  }

  const renderLabelChips = (): JSX.Element => (
    <>
      {props.labels.map((label) => (
        <Chip
          key={label.id}
          className="label-chip"
          color={label.color}
          editable={!!props.onRename}
          onEdit={(newName, newColor) =>
            handleUpdateLabelName(label.id, newName, newColor)
          }
          onDelete={
            props.onDelete ? () => handleDeleteLabel(label.id) : undefined
          }
          value={label.name}
        />
      ))}
    </>
  );

  const renderDraftLabel = (): JSX.Element | null => {
    if (!(!props.mode || props.mode === "create")) return null;

    return (
      <>
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
        {!draftLabel && props.onAdd && (
          <Button
            data-testid="add-label-button"
            isIconOnly
            onPress={addDraftLabel}
            size="xs"
          >
            <Icon icon={<HiOutlinePlus />} />
          </Button>
        )}
      </>
    );
  };

  return (
    <>
      {isReady && (
        <div
          ref={measureRef}
          className="absolute opacity-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="labels-container whitespace-nowrap">
            {renderLabelChips()}
          </div>
        </div>
      )}

      <div ref={containerRef} className="flex flex-wrap items-center gap-2">
        {props.truncate && showCount && props.labels.length > 0 ? (
          <Tooltip content={`${props.labels.map((l) => l.name).join(", ")}`}>
            <div className="text-xs h-6 w-8 flex items-center justify-start px-1 gap-1 rounded bg-secondary-400 text-default-50">
              {props.labels.length}
              <Icon icon={<HiOutlineTag />} className="text-default-50" />
            </div>
          </Tooltip>
        ) : (
          <>
            {renderLabelChips()}
            {props.loading && <Spinner size="xs" />}
            {renderDraftLabel()}
          </>
        )}
      </div>
    </>
  );
};

export default Labels;
