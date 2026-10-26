import {
  DEFAULT_LAYOUT,
  DEFAULT_SWIPE_SETTINGS,
  loadLayoutSettings,
  loadSwipeSettings,
  SETTINGS_STORAGE_KEY,
  SwipeAction,
  updateLayoutSettings,
  updateSwipeSettings,
} from "@app/utils/displayStorage";
import { beforeEach, describe, expect, it } from "vitest";

describe("displayStorage - Swipe Settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns DEFAULT_SWIPE_SETTINGS when no settings stored", () => {
    const settings = loadSwipeSettings();
    expect(settings).toEqual(DEFAULT_SWIPE_SETTINGS);
    expect(settings.swipeLeftAction).toBe(SwipeAction.DELETE);
    expect(settings.swipeRightAction).toBe(SwipeAction.ARCHIVE);
  });

  it("saves and loads updated swipe settings in curio_settings", () => {
    updateSwipeSettings({
      swipeLeftAction: SwipeAction.MARK_READ,
      swipeRightAction: SwipeAction.FAVORITE,
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(SwipeAction.MARK_READ);
    expect(settings.swipeRightAction).toBe(SwipeAction.FAVORITE);

    // Verify stored in curio_settings
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.swipeLeftAction).toBe(SwipeAction.MARK_READ);
    expect(parsed.swipeRightAction).toBe(SwipeAction.FAVORITE);
  });

  it("partially updates swipe settings without overwriting other keys", () => {
    updateSwipeSettings({
      swipeRightAction: SwipeAction.NONE,
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeRightAction).toBe(SwipeAction.NONE);
    expect(settings.swipeLeftAction).toBe(
      DEFAULT_SWIPE_SETTINGS.swipeLeftAction,
    );
  });

  it("falls back to defaults for invalid action values", () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        swipeLeftAction: "invalid_action_value",
      }),
    );

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(
      DEFAULT_SWIPE_SETTINGS.swipeLeftAction,
    );
  });

  it("merges swipe settings and layout settings cleanly in curio_settings", () => {
    updateSwipeSettings({
      swipeRightAction: SwipeAction.READ_OFFLINE,
    });

    // Updating layout settings merges with existing swipe settings
    updateLayoutSettings({
      leftSidebarOpen: false,
      rightSidebarOpen: true,
    });

    expect(loadLayoutSettings().leftSidebarOpen).toBe(false);
    expect(loadLayoutSettings().rightSidebarOpen).toBe(true);
    expect(loadSwipeSettings().swipeRightAction).toBe(SwipeAction.READ_OFFLINE);

    // Verify both are present in the single curio_settings entry
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
    expect(stored.swipeRightAction).toBe(SwipeAction.READ_OFFLINE);
    expect(stored.leftSidebarOpen).toBe(false);
    expect(stored.rightSidebarOpen).toBe(true);
  });

  it("handles corrupted JSON gracefully without crashing", () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, "not_valid_json{{{");

    expect(loadSwipeSettings()).toEqual(DEFAULT_SWIPE_SETTINGS);
    expect(loadLayoutSettings()).toEqual(DEFAULT_LAYOUT);
  });
});
