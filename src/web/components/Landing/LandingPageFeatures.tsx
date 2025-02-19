"use client";
import React, { useState } from "react";

import ItemRow from "@/components/Items/ItemRow";
import Labels, { type Label } from "@/components/Labels";
import { cn } from "@/utils/cn";

import { sampleItems, sampleLabels } from "./sampleData";

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
      />
    </>
  );
};

export default LandingPageFeatures;
