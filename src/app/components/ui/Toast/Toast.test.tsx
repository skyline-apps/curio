import Toast from "@app/components/ui/Toast";
import { useToast } from "@app/providers/Toast";
import { ToastProvider } from "@app/providers/Toast/provider";
import { act, fireEvent, render, screen } from "@app/utils/test";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("Toast component", () => {
  it("renders toast children content", () => {
    render(<Toast>Test notification</Toast>);
    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });

  it("renders action button and triggers onClick when clicked", async () => {
    const handleUndo = vi.fn();
    render(
      <Toast action={{ label: "Undo", onClick: handleUndo }}>
        Item archived
      </Toast>,
    );

    const undoButton = screen.getByRole("button", { name: "Undo" });
    expect(undoButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(undoButton);
    });

    expect(handleUndo).toHaveBeenCalledTimes(1);
  });

  it("does not render action button when action prop is omitted", () => {
    render(<Toast>No action here</Toast>);
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
  });

  it("renders action through ToastProvider showToast", async () => {
    const handleUndo = vi.fn();

    const TestTrigger = (): React.ReactElement => {
      const { showToast } = useToast();
      return (
        <button
          type="button"
          onClick={() =>
            showToast("Archived item", {
              action: {
                label: "Undo",
                onClick: handleUndo,
              },
            })
          }
        >
          Archive
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    );

    const triggerButton = screen.getByRole("button", { name: "Archive" });
    await act(async () => {
      fireEvent.click(triggerButton);
    });

    expect(screen.getByText("Archived item")).toBeInTheDocument();
    const undoButton = screen.getByRole("button", { name: "Undo" });
    expect(undoButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(undoButton);
    });

    expect(handleUndo).toHaveBeenCalledTimes(1);
  });
});
