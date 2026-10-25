import {
  DEFAULT_LAYOUT,
  DEFAULT_SWIPE_SETTINGS,
  loadLayoutSettings,
  loadSwipeSettings,
  SWIPE_SETTINGS_STORAGE_KEY,
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

  it("saves and loads updated swipe settings", () => {
    updateSwipeSettings({
      swipeLeftAction: SwipeAction.MARK_READ,
      swipeRightAction: SwipeAction.FAVORITE,
    });

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(SwipeAction.MARK_READ);
    expect(settings.swipeRightAction).toBe(SwipeAction.FAVORITE);

    // Verify stored in dedicated key
    const dedicated = localStorage.getItem(SWIPE_SETTINGS_STORAGE_KEY);
    expect(dedicated).not.toBeNull();
    expect(JSON.parse(dedicated!).swipeLeftAction).toBe(SwipeAction.MARK_READ);
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
      SWIPE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        swipeLeftAction: "invalid_action_value",
      }),
    );

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(
      DEFAULT_SWIPE_SETTINGS.swipeLeftAction,
    );
  });

  it("loads from legacy curio_settings when dedicated key is not yet present", () => {
    localStorage.setItem(
      "curio_settings",
      JSON.stringify({
        swipeLeftAction: SwipeAction.FAVORITE,
        swipeRightAction: SwipeAction.READ_OFFLINE,
      }),
    );

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(SwipeAction.FAVORITE);
    expect(settings.swipeRightAction).toBe(SwipeAction.READ_OFFLINE);
  });

  it("preserves swipe settings when layout settings are updated", () => {
    updateSwipeSettings({
      swipeRightAction: SwipeAction.READ_OFFLINE,
    });

    // Updating layout settings must not wipe or overwrite swipe settings
    updateLayoutSettings({
      leftSidebarOpen: false,
      rightSidebarOpen: false,
    });

    expect(loadLayoutSettings().leftSidebarOpen).toBe(false);
    expect(loadSwipeSettings().swipeRightAction).toBe(SwipeAction.READ_OFFLINE);
  });

  it("handles corrupted JSON gracefully without crashing", () => {
    localStorage.setItem(SWIPE_SETTINGS_STORAGE_KEY, "not_valid_json{{{");
    localStorage.setItem("curio_settings", "not_valid_json{{{");

    expect(loadSwipeSettings()).toEqual(DEFAULT_SWIPE_SETTINGS);
    expect(loadLayoutSettings()).toEqual(DEFAULT_LAYOUT);
  });
});
