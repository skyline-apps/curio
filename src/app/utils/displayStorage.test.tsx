import {
  DEFAULT_SWIPE_SETTINGS,
  loadSwipeSettings,
  SwipeAction,
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
      "curio_settings",
      JSON.stringify({
        swipeLeftAction: "invalid_action_value",
      }),
    );

    const settings = loadSwipeSettings();
    expect(settings.swipeLeftAction).toBe(
      DEFAULT_SWIPE_SETTINGS.swipeLeftAction,
    );
  });
});
