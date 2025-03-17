import { Accordion as HerouiAccordion, AccordionProps } from "@heroui/react";
import React from "react";

export { AccordionItem } from "@heroui/react";

export const Accordion: React.FC<AccordionProps> = (props) => {
  return (
    <HerouiAccordion
      itemClasses={{ title: "mb-1", subtitle: "text-xs text-secondary" }}
      {...props}
    />
  );
};
