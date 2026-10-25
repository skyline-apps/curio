import ItemRow from "@app/components/Items/ItemRow";
import { SWIPE_THRESHOLD } from "@app/components/Items/ItemRow/swipe";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { type Item } from "@app/providers/Items";
import { SettingsContext } from "@app/providers/Settings";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { SwipeAction, SwipeSettings } from "@app/utils/displayStorage";
import { act, fireEvent, render, RenderResult, screen } from "@app/utils/test";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockItem: Item = {
  id: "test-item-1",
  profileItemId: "test-profile-item-1",
  slug: "test-item-slug",
  url: "https://example.com/article",
  createdAt: new Date().toISOString(),
  excerpt: "Short excerpt for testing",
  labels: [{ id: "l1", name: "Tech", color: "#10b981" }],
  metadata: {
    title: "Test Article Title",
    description: "Test Article Description",
    source: ItemSource.EMAIL,
    thumbnail: null,
    favicon: "",
    textDirection: TextDirection.LTR,
    textLanguage: "en",
    state: ItemState.ACTIVE,
    isFavorite: false,
    lastReadAt: null,
    readingProgress: 0,
    versionName: null,
  },
};

const mockUpdateItemsState = vi.fn();
const mockUpdateItemsFavorite = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkUnread = vi.fn();

vi.mock("@app/components/Items/ItemActions/actions", () => ({
  useItemUpdate: () => ({
    updateItemsState: mockUpdateItemsState,
    updateItemsFavorite: mockUpdateItemsFavorite,
    markRead: mockMarkRead,
    markUnread: mockMarkUnread,
  }),
}));

const mockSelectItems = vi.fn();

const renderItemRow = (
  item: Item = mockItem,
  swipeSettings: SwipeSettings = {
    swipeLeftAction: SwipeAction.DELETE,
    swipeRightAction: SwipeAction.ARCHIVE,
  },
  props: {
    onClick?: (ev: React.MouseEvent) => void;
    onLongPress?: (ev: React.TouchEvent) => void;
  } = {},
): RenderResult => {
  return render(
    <SettingsContext.Provider
      value={
        {
          swipeSettings,
          updateSwipeSettings: vi.fn(),
        } as unknown as React.ContextType<typeof SettingsContext>
      }
    >
      <CurrentItemContext.Provider
        value={
          {
            currentItem: null,
            selectedItems: new Set(),
            lastSelectionIndex: null,
            selectItems: mockSelectItems,
            clearSelectedItems: vi.fn(),
          } as unknown as React.ContextType<typeof CurrentItemContext>
        }
      >
        <ItemRow item={item} index={0} {...props} />
      </CurrentItemContext.Provider>
    </SettingsContext.Provider>,
  );
};

describe("ItemRow swipe interactions", () => {
  it("renders item row with title and description", () => {
    renderItemRow();
    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
    expect(screen.getByText("Test Article Description")).toBeInTheDocument();
  });

  it("reveals right-swipe background (Archive) when swiping right past threshold", () => {
    renderItemRow();
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 20, clientY: 20 }] });
      fireEvent.touchMove(card, {
        touches: [{ clientX: 20 + SWIPE_THRESHOLD + 10, clientY: 20 }],
      });
    });

    const rightBg = screen.getByTestId("swipe-action-right-bg");
    expect(rightBg).toBeInTheDocument();
    expect(rightBg).toHaveTextContent(/Archive/i);
  });

  it("triggers archive when swiping right past threshold and released", async () => {
    vi.useFakeTimers();
    mockUpdateItemsState.mockClear();

    renderItemRow();
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 20, clientY: 20 }] });
      fireEvent.touchMove(card, {
        touches: [{ clientX: 20 + SWIPE_THRESHOLD + 20, clientY: 20 }],
      });
      fireEvent.touchEnd(card);
      vi.advanceTimersByTime(200);
    });

    expect(mockUpdateItemsState).toHaveBeenCalledWith(
      ["test-item-slug"],
      ItemState.ARCHIVED,
    );
    vi.useRealTimers();
  });

  it("reveals left-swipe background (Delete) when swiping left past threshold", () => {
    renderItemRow();
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 20 }] });
      fireEvent.touchMove(card, {
        touches: [{ clientX: 200 - SWIPE_THRESHOLD - 10, clientY: 20 }],
      });
    });

    const leftBg = screen.getByTestId("swipe-action-left-bg");
    expect(leftBg).toBeInTheDocument();
    expect(leftBg).toHaveTextContent(/Delete/i);
  });

  it("triggers delete when swiping left past threshold and released", () => {
    vi.useFakeTimers();
    mockUpdateItemsState.mockClear();

    renderItemRow();
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 20 }] });
      fireEvent.touchMove(card, {
        touches: [{ clientX: 200 - SWIPE_THRESHOLD - 20, clientY: 20 }],
      });
      fireEvent.touchEnd(card);
      vi.advanceTimersByTime(200);
    });

    expect(mockUpdateItemsState).toHaveBeenCalledWith(
      ["test-item-slug"],
      ItemState.DELETED,
    );
    vi.useRealTimers();
  });

  it("does not trigger action when swipe distance is below threshold", () => {
    vi.useFakeTimers();
    mockUpdateItemsState.mockClear();

    renderItemRow();
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 20 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 70, clientY: 20 }] }); // dx = 20 < 75
      fireEvent.touchEnd(card);
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockUpdateItemsState).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("cancels swipe when vertical scrolling is detected (dy > dx)", () => {
    vi.useFakeTimers();
    mockUpdateItemsState.mockClear();

    renderItemRow();
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 20 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 55, clientY: 60 }] }); // dy = 40, dx = 5
      fireEvent.touchMove(card, { touches: [{ clientX: 200, clientY: 60 }] }); // subsequent move ignored
      fireEvent.touchEnd(card);
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockUpdateItemsState).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("triggers mark read when swipe action is configured as MARK_READ", () => {
    mockMarkRead.mockClear();

    renderItemRow(mockItem, {
      swipeLeftAction: SwipeAction.NONE,
      swipeRightAction: SwipeAction.MARK_READ,
    });
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 20, clientY: 20 }] });
      fireEvent.touchMove(card, {
        touches: [{ clientX: 20 + SWIPE_THRESHOLD + 10, clientY: 20 }],
      });
      fireEvent.touchEnd(card);
    });

    expect(mockMarkRead).toHaveBeenCalledWith(mockItem);
  });

  it("triggers mark unread when swipe action is configured as MARK_READ and item is read", () => {
    mockMarkUnread.mockClear();
    const readItem = {
      ...mockItem,
      metadata: { ...mockItem.metadata, lastReadAt: new Date().toISOString() },
    };

    renderItemRow(readItem, {
      swipeLeftAction: SwipeAction.NONE,
      swipeRightAction: SwipeAction.MARK_READ,
    });
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 20, clientY: 20 }] });
      fireEvent.touchMove(card, {
        touches: [{ clientX: 20 + SWIPE_THRESHOLD + 10, clientY: 20 }],
      });
      fireEvent.touchEnd(card);
    });

    expect(mockMarkUnread).toHaveBeenCalledWith(readItem);
  });

  it("triggers favorite when swipe action is configured as FAVORITE", () => {
    mockUpdateItemsFavorite.mockClear();

    renderItemRow(mockItem, {
      swipeLeftAction: SwipeAction.FAVORITE,
      swipeRightAction: SwipeAction.NONE,
    });
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 20 }] });
      fireEvent.touchMove(card, {
        touches: [{ clientX: 200 - SWIPE_THRESHOLD - 10, clientY: 20 }],
      });
      fireEvent.touchEnd(card);
    });

    expect(mockUpdateItemsFavorite).toHaveBeenCalledWith(
      ["test-item-slug"],
      true,
    );
  });

  it("does not trigger action when swipe direction is set to NONE", () => {
    vi.useFakeTimers();
    mockUpdateItemsState.mockClear();

    renderItemRow(mockItem, {
      swipeLeftAction: SwipeAction.NONE,
      swipeRightAction: SwipeAction.NONE,
    });
    const card = screen.getByTestId("item-row-card-test-item-slug");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 20, clientY: 20 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 120, clientY: 20 }] });
      fireEvent.touchEnd(card);
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockUpdateItemsState).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
