import { AppLayoutContext } from "@app/providers/AppLayout";
import { SWIPE_THRESHOLD_DISTANCE } from "@app/providers/AppLayout/useSidebarSwipe";
import { AppPageProvider } from "@app/providers/AppPage/provider";
import {
  act,
  fireEvent,
  render,
  type RenderResult,
  screen,
} from "@app/utils/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("AppPageProvider sidebar swipe handling", () => {
  const originalInnerWidth = window.innerWidth;
  const mockUpdateAppLayout = vi.fn();

  beforeEach(() => {
    mockUpdateAppLayout.mockClear();
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

  const renderWithLayout = (
    leftSidebarOpen: boolean,
    rightSidebarOpen: boolean,
  ): RenderResult => {
    return render(
      <AppLayoutContext.Provider
        value={{
          appLayout: {
            leftSidebarOpen,
            rightSidebarOpen,
          },
          updateAppLayout: mockUpdateAppLayout,
          updateRootPage: vi.fn(),
          navigateToRoot: vi.fn(),
        }}
      >
        <AppPageProvider>
          <div data-testid="page-content">Page Content</div>
        </AppPageProvider>
      </AppLayoutContext.Provider>,
    );
  };

  it("opens left sidebar when swiping right from the left 1/3 of the screen", () => {
    renderWithLayout(false, false);
    const content = screen.getByTestId("page-content");

    act(() => {
      // clientX: 100 <= 300 (left 1/3)
      fireEvent.touchStart(content, createTouchEvent(100, 100));
      fireEvent.touchMove(
        content,
        createTouchEvent(100 + SWIPE_THRESHOLD_DISTANCE + 20, 100),
      );
      fireEvent.touchEnd(
        content,
        createTouchEvent(100 + SWIPE_THRESHOLD_DISTANCE + 20, 100),
      );
    });

    expect(mockUpdateAppLayout).toHaveBeenCalledWith({ leftSidebarOpen: true });
  });

  it("does not open left sidebar when swiping right from outside the left 1/3 of the screen", () => {
    renderWithLayout(false, false);
    const content = screen.getByTestId("page-content");

    act(() => {
      // clientX: 450 > 300 (outside left 1/3)
      fireEvent.touchStart(content, createTouchEvent(450, 100));
      fireEvent.touchMove(
        content,
        createTouchEvent(450 + SWIPE_THRESHOLD_DISTANCE + 20, 100),
      );
      fireEvent.touchEnd(
        content,
        createTouchEvent(450 + SWIPE_THRESHOLD_DISTANCE + 20, 100),
      );
    });

    expect(mockUpdateAppLayout).not.toHaveBeenCalledWith({
      leftSidebarOpen: true,
    });
  });

  it("closes right sidebar when swiping right from outside the left 1/3 of the screen", () => {
    renderWithLayout(false, true);
    const content = screen.getByTestId("page-content");

    act(() => {
      // clientX: 450 > 300 (outside left 1/3, right sidebar open)
      fireEvent.touchStart(content, createTouchEvent(450, 100));
      fireEvent.touchMove(
        content,
        createTouchEvent(450 + SWIPE_THRESHOLD_DISTANCE + 20, 100),
      );
      fireEvent.touchEnd(
        content,
        createTouchEvent(450 + SWIPE_THRESHOLD_DISTANCE + 20, 100),
      );
    });

    expect(mockUpdateAppLayout).toHaveBeenCalledWith({
      rightSidebarOpen: false,
    });
  });
});
