import { authenticatedFetch, isOfflineError } from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { storage } from "@app/utils/storage";
import { onlineManager, type QueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

const log = createLogger("offline-queue");

export const OFFLINE_QUEUE_STORAGE_KEY = "curio_offline_actions_queue";

export type OfflineActionType =
  | "update_item_state"
  | "update_item_favorite"
  | "add_item_label"
  | "remove_item_label"
  | "mark_item_read"
  | "mark_item_unread"
  | "update_reading_progress";

export interface QueuedOfflineAction {
  id: string;
  type: OfflineActionType;
  endpoint: string;
  method: "POST" | "DELETE" | "PUT" | "PATCH";
  body?: Record<string, unknown>;
  timestamp: number;
  entityKey?: string;
  retryCount?: number;
}

let cachedQueueCount = 0;
const queueListeners = new Set<() => void>();

function notifyQueueChange(count: number): void {
  cachedQueueCount = count;
  queueListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      log.error("Error in queue listener:", e);
    }
  });
}

export function subscribeToOfflineQueue(onStoreChange: () => void): () => void {
  queueListeners.add(onStoreChange);
  return () => {
    queueListeners.delete(onStoreChange);
  };
}

export function useOfflineQueueCount(): number {
  return useSyncExternalStore(
    subscribeToOfflineQueue,
    () => cachedQueueCount,
    () => 0,
  );
}

export async function getOfflineQueue(): Promise<QueuedOfflineAction[]> {
  try {
    const raw = await storage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as QueuedOfflineAction[];
    }
    return [];
  } catch (error) {
    log.error("Failed to read offline queue from storage:", error);
    return [];
  }
}

export async function saveOfflineQueue(
  queue: QueuedOfflineAction[],
): Promise<void> {
  try {
    await storage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    notifyQueueChange(queue.length);
  } catch (error) {
    log.error("Failed to save offline queue to storage:", error);
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await storage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
    notifyQueueChange(0);
  } catch (error) {
    log.error("Failed to clear offline queue:", error);
  }
}

export function isDeviceOnline(): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return false;
  }
  return onlineManager.isOnline();
}

export async function enqueueOfflineAction(
  action: Omit<QueuedOfflineAction, "id" | "timestamp" | "retryCount">,
): Promise<QueuedOfflineAction> {
  const queue = await getOfflineQueue();
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const newAction: QueuedOfflineAction = {
    ...action,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };

  let updatedQueue: QueuedOfflineAction[];
  if (action.entityKey) {
    const existingIndex = queue.findIndex(
      (item) => item.entityKey === action.entityKey,
    );
    if (existingIndex >= 0) {
      updatedQueue = [...queue];
      updatedQueue[existingIndex] = newAction;
      log.info(`Coalesced offline action for ${action.entityKey}`);
    } else {
      updatedQueue = [...queue, newAction];
    }
  } else {
    updatedQueue = [...queue, newAction];
  }

  await saveOfflineQueue(updatedQueue);
  return newAction;
}

export interface FlushOptions {
  queryClient?: QueryClient;
  onActionSuccess?: (action: QueuedOfflineAction) => void;
  onSuccess?: (flushedCount: number) => void;
  onError?: (error: unknown, action: QueuedOfflineAction) => void;
}

let isFlushing = false;

export async function flushOfflineQueue(
  options: FlushOptions = {},
): Promise<{ flushedCount: number; errors: unknown[] }> {
  if (isFlushing) {
    return { flushedCount: 0, errors: [] };
  }

  if (!isDeviceOnline()) {
    return { flushedCount: 0, errors: [] };
  }

  isFlushing = true;
  const errors: unknown[] = [];
  let flushedCount = 0;

  try {
    let queue = await getOfflineQueue();
    if (queue.length === 0) {
      notifyQueueChange(0);
      return { flushedCount: 0, errors: [] };
    }

    log.info(`Flushing ${queue.length} offline actions...`);

    while (queue.length > 0) {
      if (!isDeviceOnline()) {
        log.warn("Device went offline during flush, stopping.");
        break;
      }

      const action = queue[0];
      try {
        await authenticatedFetch(action.endpoint, {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        // Succeeded! Remove from queue and persist immediately
        queue = queue.slice(1);
        await saveOfflineQueue(queue);
        flushedCount++;
        options.onActionSuccess?.(action);
      } catch (err: unknown) {
        if (isOfflineError(err)) {
          log.warn("Connection lost during offline queue flush, stopping.");
          break;
        }

        // Check if 4xx permanent error (discard so queue doesn't remain perpetually blocked)
        const isClientError =
          err instanceof Error && /\b(400|401|403|404|422)\b/.test(err.message);
        const retryCount = (action.retryCount ?? 0) + 1;

        if (isClientError || retryCount >= 5) {
          log.error(
            `Discarding unrecoverable offline action ${action.id} (${action.type}):`,
            err,
          );
          errors.push(err);
          options.onError?.(err, action);
          queue = queue.slice(1);
          await saveOfflineQueue(queue);
          continue;
        }

        const isNetworkFailure =
          err instanceof Error &&
          (err.name === "TypeError" ||
            err.message.includes("NetworkError") ||
            err.message.includes("Load failed") ||
            err.message === "Failed to fetch");
        if (isNetworkFailure) {
          log.warn("Network error during offline queue flush, stopping.");
          break;
        }

        // Increment retryCount and pause flushing
        queue[0] = { ...action, retryCount };
        await saveOfflineQueue(queue);
        errors.push(err);
        break;
      }
    }

    if (flushedCount > 0) {
      options.onSuccess?.(flushedCount);
    }
  } finally {
    isFlushing = false;
  }

  return { flushedCount, errors };
}

export interface ExecuteOrQueueOptions<T> {
  action: Omit<QueuedOfflineAction, "id" | "timestamp" | "retryCount">;
  executeOnline: () => Promise<T>;
  fallbackOffline: () => T;
  onQueued?: () => void;
}

export async function executeOrQueueOfflineAction<T>({
  action,
  executeOnline,
  fallbackOffline,
  onQueued,
}: ExecuteOrQueueOptions<T>): Promise<T> {
  if (!isDeviceOnline()) {
    await enqueueOfflineAction(action);
    onQueued?.();
    return fallbackOffline();
  }

  try {
    return await executeOnline();
  } catch (error: unknown) {
    if (
      isOfflineError(error) ||
      (error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("Load failed")))
    ) {
      await enqueueOfflineAction(action);
      onQueued?.();
      return fallbackOffline();
    }
    throw error;
  }
}

export function initOfflineQueueSync(
  queryClient: QueryClient,
  onSyncCompleted?: (count: number) => void,
): () => void {
  // Sync in-memory count on init
  void getOfflineQueue().then((q) => {
    notifyQueueChange(q.length);
  });

  const handleFlush = (): void => {
    void flushOfflineQueue({
      queryClient,
      onSuccess: (count) => {
        void queryClient.invalidateQueries();
        onSyncCompleted?.(count);
      },
    });
  };

  // Attempt initial flush on mount if online
  if (isDeviceOnline()) {
    handleFlush();
  }

  const handleOnline = (): void => {
    handleFlush();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
  }

  const unsubscribeOnlineManager = onlineManager.subscribe((isOnline) => {
    if (isOnline) {
      handleFlush();
    }
  });

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline);
    }
    unsubscribeOnlineManager();
  };
}
