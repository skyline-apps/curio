import SwipeSettings from "@app/pages/settings/SwipeSettings";
import { SettingsProvider } from "@app/providers/Settings/provider";
import { ToastProvider } from "@app/providers/Toast/provider";
import {
  DEFAULT_SWIPE_SETTINGS,
  loadSwipeSettings,
  SwipeAction,
} from "@app/utils/displayStorage";
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
    renderComponent();

    // Find radio options for Swipe Right Action
    const radioInputs = screen.getAllByRole("radio");
    // Find the radio input for Favorite in swipe right
    const favoriteRadios = radioInputs.filter(
      (input) => (input as HTMLInputElement).value === SwipeAction.FAVORITE,
    );

    expect(favoriteRadios.length).toBeGreaterThan(0);
    act(() => {
      fireEvent.click(favoriteRadios[0]);
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeRightAction).toBe(SwipeAction.FAVORITE);
  });

  it("allows selecting a new swipe left action", () => {
    renderComponent();

    const radioInputs = screen.getAllByRole("radio");
    const archiveRadios = radioInputs.filter(
      (input) => (input as HTMLInputElement).value === SwipeAction.ARCHIVE,
    );

    expect(archiveRadios.length).toBeGreaterThan(0);
    // Click the second one (which corresponds to swipe left)
    act(() => {
      fireEvent.click(archiveRadios[1]);
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(SwipeAction.ARCHIVE);
  });

  it("handles swiping in the interactive preview card and resets the sample", () => {
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

    // Click Reset sample button
    const resetButton = screen.getByText("Reset sample");
    act(() => {
      fireEvent.click(resetButton);
    });

    expect(
      screen.queryByTestId("swipe-preview-feedback"),
    ).not.toBeInTheDocument();
  });

  it("resets swipe settings to defaults when reset button is clicked", () => {
    renderComponent();

    // First change to custom
    const radioInputs = screen.getAllByRole("radio");
    const markReadRadios = radioInputs.filter(
      (input) => (input as HTMLInputElement).value === SwipeAction.MARK_READ,
    );
    act(() => {
      fireEvent.click(markReadRadios[0]);
    });
    expect(loadSwipeSettings().swipeRightAction).toBe(SwipeAction.MARK_READ);

    // Click Reset button
    const resetDefaultsBtn = screen.getByText(
      "Reset swipe actions to defaults",
    );
    act(() => {
      fireEvent.click(resetDefaultsBtn);
    });

    const settings = loadSwipeSettings();
    expect(settings).toEqual(DEFAULT_SWIPE_SETTINGS);
  });
});
