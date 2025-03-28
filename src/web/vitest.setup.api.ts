import { ColorScheme, profiles } from "@web/db/schema";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  DEFAULT_TEST_USER_ID,
  DEFAULT_TEST_USER_ID_2,
  DEFAULT_TEST_USERNAME,
  DEFAULT_TEST_USERNAME_2,
} from "@web/utils/test/api";
import { testDb } from "@web/utils/test/provider";
import { beforeAll, beforeEach, vi } from "vitest";

vi.stubEnv("CURIO_EMAIL_DOMAIN", "testmail.curi.ooo");

// Set up global mocks
vi.mock("@web/lib/search");
vi.mock("@web/lib/extract");
vi.mock("@web/lib/email");
vi.mock("@web/lib/storage");
vi.mock("@web/utils/logger");
vi.mock("@web/utils/supabase/server");

// Mock the request context
const requestStore = new Map();
requestStore.set("_nextRequestStore", {
  request: new Request("http://localhost:3000"),
});

// Mock the request context
vi.mock("next/dist/client/components/request-async-storage.external", () => ({
  getRequestStore: () => requestStore,
}));

// Mock cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: "test-cookie" })),
    getAll: vi.fn(() => [{ name: "sb-access-token", value: "test-cookie" }]),
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

  await testDb.raw.query(`
      INSERT INTO auth.users (id, email)
      VALUES ('${DEFAULT_TEST_USER_ID_2}', 'test2@curi.ooo')
      ON CONFLICT (id) DO NOTHING;
    `);

  await testDb.db.insert(profiles).values({
    id: DEFAULT_TEST_PROFILE_ID,
    userId: DEFAULT_TEST_USER_ID,
    username: DEFAULT_TEST_USERNAME,
    colorScheme: ColorScheme.AUTO,
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    newsletterEmail: "test@testmail.curi.ooo",
  });

  await testDb.db.insert(profiles).values({
    id: DEFAULT_TEST_PROFILE_ID_2,
    userId: DEFAULT_TEST_USER_ID_2,
    username: DEFAULT_TEST_USERNAME_2,
    colorScheme: ColorScheme.AUTO,
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
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
