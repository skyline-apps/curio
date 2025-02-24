import { vi } from "vitest";

import type { TestDatabase } from "./db";
import { createTestDb } from "./db";

// Create a singleton test database instance
export let testDb: TestDatabase;

// Override the database instance for tests
vi.mock("@/db/index", async () => {
  const actual = await vi.importActual("@/db/index");
  return {
    ...actual,
    get db() {
      return testDb.db;
    },
  };
});

beforeAll(async () => {
  testDb = await createTestDb();
});
