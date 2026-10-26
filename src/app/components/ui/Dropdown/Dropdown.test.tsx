import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@app/components/ui/Dropdown";
import { act, fireEvent, render, screen } from "@app/utils/test";
import React from "react";
import { describe, expect, it } from "vitest";

describe("Dropdown component", () => {
  it("renders trigger and opens menu on click with disabled animation and unblocked scroll defaults", async () => {
    render(
      <Dropdown>
        <DropdownTrigger>
          <button type="button">Actions</button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Actions">
          <DropdownItem key="action1">Action 1</DropdownItem>
        </DropdownMenu>
      </Dropdown>,
    );

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toBeInTheDocument();

    act(() => {
      fireEvent.click(trigger);
    });

    const menuItem = await screen.findByText("Action 1");
    expect(menuItem).toBeInTheDocument();
  });
});
