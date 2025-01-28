import { createTestDb } from "./db";

// Create a singleton test database instance
export let testDb: Awaited<ReturnType<typeof createTestDb>>;

// Override the database instance for tests
jest.mock("@/db/index", () => ({
  ...jest.requireActual("@/db/index"),
  get db() {
    return testDb.db;
  },
}));

beforeAll(async () => {
  testDb = await createTestDb();
});
