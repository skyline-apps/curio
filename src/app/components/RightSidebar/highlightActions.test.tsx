import { useHighlightUpdate } from "@app/components/RightSidebar/highlightActions";
import {
  type Highlight,
  type NewHighlight,
} from "@app/schemas/v1/items/highlights";
import { clearOfflineQueue, getOfflineQueue } from "@app/utils/offlineQueue";
import { act, renderHook } from "@app/utils/test";
import { AllProviders } from "@app/utils/test/component";
import { onlineManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAuthenticatedFetch = vi.fn();
const mockShowToast = vi.fn();

vi.mock("@app/utils/api", async () => {
  const actual = await vi.importActual("@app/utils/api");
  return {
    ...actual,
    authenticatedFetch: (...args: unknown[]) => mockAuthenticatedFetch(...args),
  };
});

vi.mock("@app/providers/Toast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@app/providers/Toast")>();
  return {
    ...actual,
    useToast: () => ({
      showToast: mockShowToast,
      hideToast: vi.fn(),
    }),
  };
});

describe("useHighlightUpdate offline actions", () => {
  const mockHighlight: Highlight = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    startOffset: 10,
    endOffset: 25,
    text: "Sample highlighted text",
    note: "My offline note",
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthenticatedFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        highlights: [mockHighlight],
        deleted: [{ id: mockHighlight.id }],
      }),
      text: async () => "{}",
    }));
    await clearOfflineQueue();
    onlineManager.setOnline(true);
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  afterEach(async () => {
    await clearOfflineQueue();
  });

  it("creates highlight online and executes API call", async () => {
    const newHighlight: NewHighlight = {
      startOffset: 10,
      endOffset: 25,
      text: "Sample highlighted text",
      note: null,
    };

    const { result } = renderHook(
      () =>
        useHighlightUpdate({
          currentHighlight: null,
          itemSlug: "test-slug",
        }),
      { wrapper: AllProviders },
    );

    await act(async () => {
      await result.current.createHighlight(newHighlight);
    });

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
      "/api/v1/items/highlights",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(0);
  });

  it("queues highlight creation when offline and shows toast", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    onlineManager.setOnline(false);

    const newHighlight: NewHighlight = {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      startOffset: 10,
      endOffset: 25,
      text: "Sample highlighted text",
      note: "Note while offline",
    };

    const { result } = renderHook(
      () =>
        useHighlightUpdate({
          currentHighlight: null,
          itemSlug: "test-slug",
        }),
      { wrapper: AllProviders },
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.createHighlight(newHighlight);
    });

    expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      "Saved offline. Will sync when reconnected.",
    );
    expect(res).toEqual({
      highlights: [newHighlight],
    });

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("create_or_update_highlight");
    expect(queue[0].method).toBe("POST");
    expect(queue[0].body).toEqual({
      slug: "test-slug",
      highlights: [newHighlight],
    });
  });

  it("queues highlight deletion when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    onlineManager.setOnline(false);

    const { result } = renderHook(
      () =>
        useHighlightUpdate({
          currentHighlight: mockHighlight,
          itemSlug: "test-slug",
        }),
      { wrapper: AllProviders },
    );

    let res: unknown;
    await act(async () => {
      res = await result.current.deleteHighlight();
    });

    expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      "Saved offline. Will sync when reconnected.",
    );
    expect(res).toEqual({
      deleted: [{ id: mockHighlight.id }],
    });

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("delete_highlight");
    expect(queue[0].method).toBe("DELETE");
    expect(queue[0].body).toEqual({
      slug: "test-slug",
      highlightIds: [mockHighlight.id],
    });
  });
});
