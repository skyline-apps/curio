import { act, fireEvent, render, screen } from "@app/utils/test";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isLeftThirdOfScreen,
  SWIPE_THRESHOLD_DISTANCE,
  useSidebarSwipe,
} from "./useSidebarSwipe";

interface TestComponentProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  side: "left" | "right";
}

const TestComponent: React.FC<TestComponentProps> = ({
  isOpen,
  onOpen,
  onClose,
  side,
}) => {
  const bind = useSidebarSwipe({ isOpen, onOpen, onClose, side });
  return (
    <div
      data-testid="swipe-target"
      {...bind()}
      style={{ width: "100%", height: "200px" }}
    />
  );
};

interface TouchEventInitData {
  touches: Array<{ clientX: number; clientY: number; identifier: number }>;
  targetTouches: Array<{
    clientX: number;
    clientY: number;
    identifier: number;
  }>;
  changedTouches: Array<{
    clientX: number;
    clientY: number;
    identifier: number;
  }>;
}

const createTouchEvent = (
  clientX: number,
  clientY: number,
): TouchEventInitData => {
  const touch = { clientX, clientY, identifier: 0 };
  return {
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch],
  };
};

describe("isLeftThirdOfScreen", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 900,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns true when clientX is within the left 1/3 of the screen", () => {
    expect(isLeftThirdOfScreen(0)).toBe(true);
    expect(isLeftThirdOfScreen(100)).toBe(true);
    expect(isLeftThirdOfScreen(300)).toBe(true);
  });

  it("returns false when clientX is past the left 1/3 of the screen", () => {
    expect(isLeftThirdOfScreen(301)).toBe(false);
    expect(isLeftThirdOfScreen(450)).toBe(false);
    expect(isLeftThirdOfScreen(800)).toBe(false);
  });
});

describe("useSidebarSwipe", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 900,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("opens left sidebar when swipe right starts in the left 1/3 of the screen", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(
      <TestComponent
        isOpen={false}
        onOpen={onOpen}
        onClose={onClose}
        side="left"
      />,
    );

    const target = screen.getByTestId("swipe-target");

    act(() => {
      // Start in left 1/3 (clientX: 100 <= 300)
      fireEvent.touchStart(target, createTouchEvent(100, 50));
      fireEvent.touchMove(
        target,
        createTouchEvent(100 + SWIPE_THRESHOLD_DISTANCE + 20, 50),
      );
      fireEvent.touchEnd(
        target,
        createTouchEvent(100 + SWIPE_THRESHOLD_DISTANCE + 20, 50),
      );
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not open left sidebar when swipe right starts outside the left 1/3 of the screen", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(
      <TestComponent
        isOpen={false}
        onOpen={onOpen}
        onClose={onClose}
        side="left"
      />,
    );

    const target = screen.getByTestId("swipe-target");

    act(() => {
      // Start outside left 1/3 (clientX: 400 > 300)
      fireEvent.touchStart(target, createTouchEvent(400, 50));
      fireEvent.touchMove(
        target,
        createTouchEvent(400 + SWIPE_THRESHOLD_DISTANCE + 20, 50),
      );
      fireEvent.touchEnd(
        target,
        createTouchEvent(400 + SWIPE_THRESHOLD_DISTANCE + 20, 50),
      );
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes left sidebar when swiping left even from outside the left 1/3", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(
      <TestComponent
        isOpen={true}
        onOpen={onOpen}
        onClose={onClose}
        side="left"
      />,
    );

    const target = screen.getByTestId("swipe-target");

    act(() => {
      // Swiping left to close
      fireEvent.touchStart(target, createTouchEvent(500, 50));
      fireEvent.touchMove(
        target,
        createTouchEvent(500 - SWIPE_THRESHOLD_DISTANCE - 20, 50),
      );
      fireEvent.touchEnd(
        target,
        createTouchEvent(500 - SWIPE_THRESHOLD_DISTANCE - 20, 50),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
