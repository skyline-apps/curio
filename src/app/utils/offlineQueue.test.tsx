import { OfflineError } from "@app/utils/api";
import {
  clearOfflineQueue,
  enqueueOfflineAction,
  executeOrQueueOfflineAction,
  flushOfflineQueue,
  getOfflineQueue,
  initOfflineQueueSync,
} from "@app/utils/offlineQueue";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAuthenticatedFetch = vi.fn();
vi.mock("@app/utils/api", async () => {
  const actual = await vi.importActual("@app/utils/api");
  return {
    ...actual,
    authenticatedFetch: (...args: unknown[]) => mockAuthenticatedFetch(...args),
  };
});

describe("offlineQueue", () => {
  beforeEach(async () => {
    await clearOfflineQueue();
    vi.clearAllMocks();
    onlineManager.setOnline(true);
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  afterEach(async () => {
    await clearOfflineQueue();
  });

  describe("queue storage operations", () => {
    it("enqueues and retrieves offline actions", async () => {
      const action = await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "test-slug", state: "archived" },
      });

      expect(action.id).toBeDefined();
      expect(action.type).toBe("update_item_state");

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].endpoint).toBe("/api/v1/items/state");
    });

    it("coalesces actions with the same entityKey", async () => {
      await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "test-slug", state: "archived" },
        entityKey: "state:test-slug",
      });

      await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "test-slug", state: "active" },
        entityKey: "state:test-slug",
      });

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].body).toEqual({ slugs: "test-slug", state: "active" });
    });

    it("clears the offline queue", async () => {
      await enqueueOfflineAction({
        type: "update_item_favorite",
        endpoint: "/api/v1/items/favorite",
        method: "POST",
        body: { slugs: "test-slug", favorite: true },
      });

      await clearOfflineQueue();
      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe("flushOfflineQueue", () => {
    it("does not flush when offline", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });

      await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "slug-1", state: "archived" },
      });

      const result = await flushOfflineQueue();
      expect(result.flushedCount).toBe(0);
      expect(mockAuthenticatedFetch).not.toHaveBeenCalled();

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
    });

    it("successfully sends actions and removes them from queue when online", async () => {
      mockAuthenticatedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updated: [] }),
      });

      await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "slug-1", state: "archived" },
      });

      const onActionSuccess = vi.fn();
      const onSuccess = vi.fn();

      const result = await flushOfflineQueue({ onActionSuccess, onSuccess });
      expect(result.flushedCount).toBe(1);
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        "/api/v1/items/state",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: "slug-1", state: "archived" }),
        },
      );
      expect(onActionSuccess).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(1);

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(0);
    });

    it("halts flushing and retains queue when an offline error occurs mid-flush", async () => {
      mockAuthenticatedFetch.mockRejectedValueOnce(
        new OfflineError("It looks like you're offline..."),
      );

      await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "slug-1", state: "archived" },
      });

      const result = await flushOfflineQueue();
      expect(result.flushedCount).toBe(0);

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
    });

    it("discards unrecoverable 4xx client errors to prevent queue blocking", async () => {
      mockAuthenticatedFetch.mockRejectedValueOnce(
        new Error("Failed to fetch: 400 Bad Request"),
      );

      await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "invalid", state: "archived" },
      });

      const onError = vi.fn();
      const result = await flushOfflineQueue({ onError });

      expect(result.flushedCount).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(onError).toHaveBeenCalled();

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe("executeOrQueueOfflineAction", () => {
    it("executes online when device is online", async () => {
      const executeOnline = vi.fn().mockResolvedValue("success");
      const fallbackOffline = vi.fn().mockReturnValue("fallback");
      const onQueued = vi.fn();

      const result = await executeOrQueueOfflineAction({
        action: {
          type: "update_item_state",
          endpoint: "/api/v1/items/state",
          method: "POST",
          body: { slugs: "slug-1", state: "archived" },
        },
        executeOnline,
        fallbackOffline,
        onQueued,
      });

      expect(result).toBe("success");
      expect(executeOnline).toHaveBeenCalledTimes(1);
      expect(fallbackOffline).not.toHaveBeenCalled();
      expect(onQueued).not.toHaveBeenCalled();
    });

    it("queues and returns fallback without throwing when device is offline", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
      });

      const executeOnline = vi.fn();
      const fallbackOffline = vi.fn().mockReturnValue("offline-result");
      const onQueued = vi.fn();

      const result = await executeOrQueueOfflineAction({
        action: {
          type: "update_item_state",
          endpoint: "/api/v1/items/state",
          method: "POST",
          body: { slugs: "slug-1", state: "archived" },
        },
        executeOnline,
        fallbackOffline,
        onQueued,
      });

      expect(result).toBe("offline-result");
      expect(executeOnline).not.toHaveBeenCalled();
      expect(onQueued).toHaveBeenCalledTimes(1);

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
    });

    it("catches OfflineError from online execution, queues action and returns fallback", async () => {
      const executeOnline = vi
        .fn()
        .mockRejectedValue(new OfflineError("It looks like you're offline..."));
      const fallbackOffline = vi.fn().mockReturnValue("recovered-offline");
      const onQueued = vi.fn();

      const result = await executeOrQueueOfflineAction({
        action: {
          type: "update_item_favorite",
          endpoint: "/api/v1/items/favorite",
          method: "POST",
          body: { slugs: "slug-1", favorite: true },
        },
        executeOnline,
        fallbackOffline,
        onQueued,
      });

      expect(result).toBe("recovered-offline");
      expect(onQueued).toHaveBeenCalledTimes(1);

      const queue = await getOfflineQueue();
      expect(queue).toHaveLength(1);
    });

    it("re-throws non-offline errors", async () => {
      const executeOnline = vi
        .fn()
        .mockRejectedValue(new Error("Server 500 error"));
      const fallbackOffline = vi.fn();

      await expect(
        executeOrQueueOfflineAction({
          action: {
            type: "update_item_state",
            endpoint: "/api/v1/items/state",
            method: "POST",
          },
          executeOnline,
          fallbackOffline,
        }),
      ).rejects.toThrow("Server 500 error");

      expect(fallbackOffline).not.toHaveBeenCalled();
    });
  });

  describe("initOfflineQueueSync", () => {
    it("subscribes to online events and invalidates queryClient on flush", async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ updated: [] }),
      });

      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const onSyncCompleted = vi.fn();

      await enqueueOfflineAction({
        type: "update_item_state",
        endpoint: "/api/v1/items/state",
        method: "POST",
        body: { slugs: "slug-1", state: "archived" },
      });

      const cleanup = initOfflineQueueSync(queryClient, onSyncCompleted);

      // Trigger online event
      window.dispatchEvent(new Event("online"));

      // Wait a tick for async flush
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockAuthenticatedFetch).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
      expect(onSyncCompleted).toHaveBeenCalledWith(1);

      cleanup();
    });
  });
});
