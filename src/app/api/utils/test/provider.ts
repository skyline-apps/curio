import type { TestDatabase } from "@app/api/utils/test/db";
import { createTestDb } from "@app/api/utils/test/db";
import { beforeAll, vi } from "vitest";

// Create a singleton test database instance
export let testDb: TestDatabase;

// Override the database instance for tests
vi.mock("@app/api/db/index", async () => {
  const actual = await vi.importActual("@app/api/db/index");
  return {
    ...actual,
    getDb() {
      return testDb.db;
    },
  };
});

beforeAll(async () => {
  testDb = await createTestDb();
});
