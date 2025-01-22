import { createTestDb } from "./db";

// Create a singleton test database instance
export let testDb: Awaited<ReturnType<typeof createTestDb>>;

// Override the database instance for tests
jest.mock("@/db/index", () => ({
  __esModule: true,
  get db() {
    return testDb.db;
  },
  eq: jest.requireActual("drizzle-orm").eq,
  gt: jest.requireActual("drizzle-orm").gt,
  gte: jest.requireActual("drizzle-orm").gte,
  lt: jest.requireActual("drizzle-orm").lt,
  lte: jest.requireActual("drizzle-orm").lte,
  ne: jest.requireActual("drizzle-orm").ne,
  sql: jest.requireActual("drizzle-orm").sql,
  and: jest.requireActual("drizzle-orm").and,
}));

beforeAll(async () => {
  testDb = await createTestDb();
});
