import { render, screen } from "@app/utils/test/component";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import LandingPageFeatures from "./LandingPageFeatures";
import { sampleItems, sampleLabels } from "./sampleData";

describe("LandingPageFeatures", () => {
  beforeEach(() => {
    render(<LandingPageFeatures />);
  });

  describe("Collect Section", () => {
    it("renders sample items with correct titles and descriptions", () => {
      // Check for sample items
      sampleItems.forEach((item) => {
        expect(screen.getByText(item.metadata.title)).toBeInTheDocument();
        expect(screen.getByText(item.metadata.description)).toBeInTheDocument();
      });
    });
  });

  describe("Organize Section", () => {
    it("renders labels and allows adding/deleting labels", async () => {
      const user = userEvent.setup();

      // Check initial labels
      sampleLabels.forEach((label) => {
        expect(screen.getAllByText(label.name)).toHaveLength(2);
      });

      // Add a new label
      const addButton = screen.getByTestId("add-label-button");
      await user.click(addButton);

      // Type in the new label name
      const input = screen.getByRole("textbox");
      await user.type(input, "New Label{enter}");

      // Verify new label is added
      expect(screen.getAllByText("New Label")).toHaveLength(2);

      // Delete a label
      const deleteButton = screen.getAllByTestId("delete-button")[0];
      await user.click(deleteButton);

      // Verify label was deleted
      expect(screen.queryByText(sampleLabels[0].name)).not.toBeInTheDocument();
    });
  });

  describe("Focus Section", () => {
    it("renders markdown content with text selection", async () => {
      const highlightedText = screen.getByText(/be authentic to yourself/);
      expect(highlightedText).toHaveClass("bg-warning-300");
    });
  });

  describe("Feature Layout", () => {
    it("renders all feature sections with correct titles and descriptions", () => {
      // Check feature titles
      expect(screen.getByText("Collect")).toBeInTheDocument();
      expect(screen.getByText("Organize")).toBeInTheDocument();
      expect(screen.getByText("Focus")).toBeInTheDocument();

      // Check feature descriptions
      expect(
        screen.getByText(/Capture content that matters/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your ideas, beautifully organized/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Read on your terms/)).toBeInTheDocument();

      // Check layout
      const features = screen.getAllByRole("heading", { level: 4 });
      expect(features).toHaveLength(3);
    });
  });
});
