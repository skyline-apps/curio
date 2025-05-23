import { Persister } from "@tanstack/react-query-persist-client";
import { vi } from "vitest";

export const storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

function createPersister(): Persister {
  return {
    persistClient: vi.fn(),
    restoreClient: vi.fn(),
    removeClient: vi.fn(),
  };
}

export const asyncStoragePersister = createPersister();
