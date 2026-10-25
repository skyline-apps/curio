import SwipeSettings from "@app/pages/settings/SwipeSettings";
import { SettingsProvider } from "@app/providers/Settings/provider";
import { ToastProvider } from "@app/providers/Toast/provider";
import { loadSwipeSettings, SwipeAction } from "@app/utils/displayStorage";
import { act, fireEvent, render, RenderResult, screen } from "@app/utils/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@app/providers/User", () => ({
  useUser: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
  }),
}));

const renderComponent = (): RenderResult =>
  render(
    <ToastProvider>
      <SettingsProvider>
        <SwipeSettings />
      </SettingsProvider>
    </ToastProvider>,
  );

describe("SwipeSettings component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders both swipe action configuration sections and the interactive preview", () => {
    renderComponent();

    expect(screen.getByText("Swipe right")).toBeInTheDocument();
    expect(screen.getByText("Swipe left")).toBeInTheDocument();
    expect(screen.getByText("Gesture preview")).toBeInTheDocument();
    expect(screen.getByText("Interactive swipe preview")).toBeInTheDocument();
  });

  it("allows selecting a new swipe right action", () => {
    const { container } = renderComponent();

    const selectElements = container.querySelectorAll("select");
    expect(selectElements.length).toBeGreaterThanOrEqual(2);

    act(() => {
      fireEvent.change(selectElements[0], {
        target: { value: SwipeAction.FAVORITE },
      });
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeRightAction).toBe(SwipeAction.FAVORITE);
  });

  it("allows selecting a new swipe left action", () => {
    const { container } = renderComponent();

    const selectElements = container.querySelectorAll("select");
    expect(selectElements.length).toBeGreaterThanOrEqual(2);

    act(() => {
      fireEvent.change(selectElements[1], {
        target: { value: SwipeAction.ARCHIVE },
      });
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(SwipeAction.ARCHIVE);
  });

  it("allows selecting READ_OFFLINE and triggers it in the interactive preview", () => {
    const { container } = renderComponent();

    const selectElements = container.querySelectorAll("select");
    act(() => {
      fireEvent.change(selectElements[0], {
        target: { value: SwipeAction.READ_OFFLINE },
      });
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeRightAction).toBe(SwipeAction.READ_OFFLINE);

    const card = screen.getByTestId("item-row-card-swipe-preview-item");
    act(() => {
      fireEvent.touchStart(card!, { touches: [{ clientX: 50, clientY: 50 }] });
      fireEvent.touchMove(card!, { touches: [{ clientX: 160, clientY: 50 }] });
      fireEvent.touchEnd(card!);
    });

    const feedback = screen.getByTestId("swipe-preview-feedback");
    expect(feedback).toHaveTextContent("Triggered: Read offline");
  });

  it("does not render removed swipe helper text or reset buttons", () => {
    renderComponent();

    expect(
      screen.queryByText("Swipe the card above to test."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Reset sample")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Reset swipe actions to defaults"),
    ).not.toBeInTheDocument();
  });

  it("handles swiping in the interactive preview card", () => {
    renderComponent();

    const card = screen.getByTestId("item-row-card-swipe-preview-item");
    expect(card).toBeInTheDocument();

    // Simulate touch drag right (dx = 110 > threshold 75)
    act(() => {
      fireEvent.touchStart(card!, { touches: [{ clientX: 50, clientY: 50 }] });
      fireEvent.touchMove(card!, { touches: [{ clientX: 160, clientY: 50 }] });
      fireEvent.touchEnd(card!);
    });

    expect(screen.getByTestId("swipe-preview-feedback")).toBeInTheDocument();
    expect(screen.getByTestId("swipe-preview-feedback")).toHaveTextContent(
      "Triggered: Archived",
    );
  });
});
