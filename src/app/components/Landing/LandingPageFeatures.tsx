import { calculateHighlight } from "@app/components/Article/useHighlightSelection";
import {
  ALL_COMPONENTS,
  removeHighlightsOverlap,
  wrapMarkdownComponent,
} from "@app/components/Article/wrapMarkdownComponent";
import ItemRow from "@app/components/Items/ItemRow";
import Labels, { type Label } from "@app/components/Labels";
import Markdown, { type Components } from "@app/components/Markdown";
import { cn } from "@app/utils/cn";
import { type Highlight } from "@web/app/api/v1/items/highlights/validation";
import React, { useMemo, useState } from "react";

import {
  sampleArticle,
  sampleHighlights,
  sampleItems,
  sampleLabels,
} from "./sampleData";

interface FeatureProps extends React.PropsWithChildren {
  title: string;
  description: string;
  isReversed?: boolean;
}

const Feature: React.FC<FeatureProps> = ({
  title,
  description,
  isReversed,
  children,
}: FeatureProps) => (
  <div
    className={cn(
      "flex flex-col items-center gap-4",
      isReversed ? "md:flex-row-reverse" : "md:flex-row",
    )}
  >
    <div
      className={cn(
        "flex flex-col text-center grow",
        isReversed
          ? "md:items-start md:text-left"
          : "md:items-end md:text-right",
      )}
    >
      <h4 className="italic text-lg">{title}</h4>
      <p className="mt-2 text-secondary">{description}</p>
    </div>
    <div className="bg-background border-4 border-background h-40 w-60 shrink-0 p-2 overflow-x-hidden overflow-y-auto">
      {children}
    </div>
  </div>
);

const LandingPageFeatures: React.FC = () => {
  const [labels, setLabels] = useState<Label[]>(sampleLabels);
  const [draftHighlight, setDraftHighlight] = useState<Highlight | null>(null);

  const handleAddLabel = (label: Omit<Label, "id">): void => {
    setLabels([
      ...labels,
      {
        color: label.color,
        name: label.name.substring(0, 20),
        id: crypto.randomUUID(),
      },
    ]);
  };

  const handleDeleteLabel = (id: string): void => {
    setLabels(labels.filter((label) => label.id !== id));
  };

  const clearSelection = (): void => {
    setDraftHighlight(null);
  };

  const handleSelection = (): void => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const highlight = calculateHighlight(selection);
    if (!highlight) {
      return;
    }
    setDraftHighlight({
      ...highlight,
      id: crypto.randomUUID(),
    });
  };

  const allHighlights: Highlight[] = useMemo(
    () =>
      draftHighlight ? [...sampleHighlights, draftHighlight] : sampleHighlights,
    [draftHighlight],
  );

  const nonOverlappingHighlights = useMemo(
    () => removeHighlightsOverlap(allHighlights),
    [allHighlights],
  );

  const markdownComponents: Components = Object.fromEntries(
    ALL_COMPONENTS.map((c) => [
      c,
      wrapMarkdownComponent(c, nonOverlappingHighlights, null),
    ]),
  );

  return (
    <>
      <Feature
        title="Collect"
        description="Capture content that matters, all in one place. Save any link from the internet, and send email newsletters straight to your Curio inbox."
        isReversed
      >
        <div className="flex flex-col w-80 gap-1">
          {sampleItems.map((item, index) => (
            <ItemRow key={item.id} item={item} index={index} />
          ))}
        </div>
      </Feature>
      <Feature
        title="Organize"
        description="Your ideas, beautifully organized. Tag, favorite, highlight, and add notes to build your personal library of insights."
      >
        <Labels
          mode="create"
          labels={labels}
          onAdd={handleAddLabel}
          onDelete={handleDeleteLabel}
        />
      </Feature>
      <Feature
        title="Focus"
        description="Read on your terms, free from distractions. Dive into articles in a clean, streamlined markdown viewer that works online and offline."
        isReversed
      >
        <div
          onMouseDown={clearSelection}
          onTouchStart={clearSelection}
          onMouseUp={handleSelection}
          onTouchEnd={handleSelection}
        >
          <Markdown
            className="text-xs select-text overflow-hidden leading-6"
            components={markdownComponents}
          >
            {sampleArticle}
          </Markdown>
        </div>
      </Feature>
    </>
  );
};

export default LandingPageFeatures;
