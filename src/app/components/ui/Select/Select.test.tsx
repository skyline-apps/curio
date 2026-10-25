import { Select, SelectItem } from "@app/components/ui/Select";
import { render } from "@app/utils/test";
import React from "react";
import { describe, expect, it } from "vitest";

describe("Select component", () => {
  it("renders with default size sm and standard input background styling", () => {
    const { container } = render(
      <Select aria-label="Test select" defaultSelectedKeys={["opt1"]}>
        <SelectItem key="opt1">Option 1</SelectItem>
        <SelectItem key="opt2">Option 2</SelectItem>
      </Select>,
    );

    const trigger = container.querySelector('[data-slot="trigger"]');
    expect(trigger).toBeInTheDocument();
    // Verify standard INPUT_CLASSES are present on trigger
    expect(trigger).toHaveClass("dark:bg-default-950");
    expect(trigger).toHaveClass("bg-default-50");
  });

  it("applies contrast classes when contrast prop is true", () => {
    const { container } = render(
      <Select aria-label="Test select" contrast>
        <SelectItem key="opt1">Option 1</SelectItem>
      </Select>,
    );

    const trigger = container.querySelector('[data-slot="trigger"]');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass("bg-default-25");
    expect(trigger).toHaveClass("dark:bg-default-975");
  });

  it("applies transparent classes when transparent prop is true", () => {
    const { container } = render(
      <Select aria-label="Test select" transparent>
        <SelectItem key="opt1">Option 1</SelectItem>
      </Select>,
    );

    const trigger = container.querySelector('[data-slot="trigger"]');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass("bg-transparent");
  });

  it("merges custom trigger classNames while retaining default classes", () => {
    const { container } = render(
      <Select
        aria-label="Test select"
        classNames={{ trigger: "custom-trigger-class" }}
      >
        <SelectItem key="opt1">Option 1</SelectItem>
      </Select>,
    );

    const trigger = container.querySelector('[data-slot="trigger"]');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass("custom-trigger-class");
    expect(trigger).toHaveClass("dark:bg-default-950");
  });
});
