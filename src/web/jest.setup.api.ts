import { apiKeys, ColorScheme, profiles } from "@/db/schema";

import {
  DEFAULT_TEST_API_KEY,
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_USER_ID,
} from "./utils/test/api";
import { testDb } from "./utils/test/provider";

// Mock the request context
const requestStore = new Map();
requestStore.set("_nextRequestStore", {
  request: new Request("http://localhost:3000"),
});

// Mock the request context
jest.mock("next/dist/client/components/request-async-storage.external", () => ({
  getRequestStore: () => requestStore,
}));

// Mock cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: "test-cookie" })),
    getAll: jest.fn(() => [{ name: "sb-access-token", value: "test-cookie" }]),
  })),
}));

type TableResult = {
  rows: Array<{ tablename: string }>;
};

beforeAll(async () => {
  await testDb.raw.query(`
      INSERT INTO auth.users (id, email)
      VALUES ('${DEFAULT_TEST_USER_ID}', 'test@curi.ooo')
      ON CONFLICT (id) DO NOTHING;
    `);

  await testDb.db.insert(profiles).values({
    id: DEFAULT_TEST_PROFILE_ID,
    userId: DEFAULT_TEST_USER_ID,
    username: "defaultuser",
    colorScheme: ColorScheme.AUTO,
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  });

  await testDb.db.insert(apiKeys).values({
    profileId: DEFAULT_TEST_PROFILE_ID,
    key: DEFAULT_TEST_API_KEY,
    name: "test-api-key",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    isActive: true,
  });
});

beforeEach(async () => {
  const result: TableResult = await testDb.raw.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  for (const { tablename } of result.rows.reverse()) {
    if (tablename === "profiles" || tablename === "api_keys") {
      continue;
    }
    await testDb.raw.query(`DELETE FROM "${tablename}";`);
  }
});
