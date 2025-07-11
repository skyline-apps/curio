import { profiles } from "@app/api/db/schema";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
  DEFAULT_TEST_USER_ID,
  DEFAULT_TEST_USER_ID_2,
  DEFAULT_TEST_USERNAME,
  DEFAULT_TEST_USERNAME_2,
} from "@app/api/utils/test/api";
import { testDb } from "@app/api/utils/test/provider";
import { ColorScheme } from "@app/schemas/db";
import { beforeAll, beforeEach, vi } from "vitest";

// Set up global mocks
vi.mock("@app/api/lib/search");
vi.mock("@app/api/lib/extract");
vi.mock("@app/api/lib/email");
vi.mock("@app/api/lib/instapaper");
vi.mock("@app/api/lib/storage");
vi.mock("@app/api/lib/supabase/client");
vi.mock("@app/api/utils/supabase/server");
vi.mock("@app/api/lib/llm");

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
    public: true,
    isPremium: true,
    premiumExpiresAt: new Date(Date.now() + 60 * 60 * 1000 * 24 * 30),
    upgradeBannerLastShownAt: new Date("2025-01-10T12:52:56-08:00"),
  });

  await testDb.db.insert(profiles).values({
    id: DEFAULT_TEST_PROFILE_ID_2,
    userId: DEFAULT_TEST_USER_ID_2,
    username: DEFAULT_TEST_USERNAME_2,
    colorScheme: ColorScheme.AUTO,
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
    isPremium: false,
    upgradeBannerLastShownAt: new Date("2025-01-10T12:52:56-08:00"),
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
