import React from "react";

import { cn } from "@/utils/cn";

interface FeatureProps {
  title: string;
  description: string;
  isReversed?: boolean;
}

const Feature: React.FC<FeatureProps> = ({
  title,
  description,
  isReversed,
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
    <div className="bg-background h-40 w-60 shrink-0"></div>
  </div>
);

const LandingPageFeatures: React.FC = () => {
  return (
    <>
      <Feature
        title="Collect"
        description="Capture content that matters, all in one place. Save any link from the internet, and send email newsletters straight to your Curio inbox."
        isReversed
      />
      <Feature
        title="Organize"
        description="Your ideas, beautifully organized. Tag, favorite, highlight, and add notes to build your personal library of insights."
      />
      <Feature
        title="Focus"
        description="Read on your terms, free from distractions. Dive into articles in a clean, streamlined markdown viewer that works online and offline."
        isReversed
      />
    </>
  );
};

export default LandingPageFeatures;
