import { Persister } from "@tanstack/react-query-persist-client";
import { vi } from "vitest";

let mockStore: Record<string, string> = {};

export const storage = {
  getItem: vi.fn(
    async (key: string): Promise<string | null> => mockStore[key] ?? null,
  ),
  setItem: vi.fn(async (key: string, value: string): Promise<void> => {
    mockStore[key] = value;
  }),
  removeItem: vi.fn(async (key: string): Promise<void> => {
    delete mockStore[key];
  }),
  __clear: (): void => {
    mockStore = {};
  },
};

function createPersister(): Persister {
  return {
    persistClient: vi.fn(),
    restoreClient: vi.fn(),
    removeClient: vi.fn(),
  };
}

export const asyncStoragePersister = createPersister();
