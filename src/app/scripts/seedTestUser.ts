/* eslint-disable no-console */
/**
 * Local dev seed: ensures a login-ready test user exists in Supabase Auth
 * and the profiles table so the app can be driven immediately after migration.
 *
 * Idempotent — safe to run on every docker compose up / dev:up.
 *
 * Usage:
 *   npx tsx scripts/seedTestUser.ts
 */
// eslint-disable-next-line no-restricted-imports
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";

for (const envPath of [
  resolve(process.cwd(), ".env"),
  resolve(import.meta.dirname, "../.env"),
  resolve(import.meta.dirname, "../../.env"),
]) {
  if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // Ignored
    }
  }
}

function createUsernameSlug(email: string): string {
  const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  const uniqueSuffix = Math.random().toString(36).substring(7);
  return username + uniqueSuffix;
}

async function main(): Promise<void> {
  const {
    TEST_USER_EMAIL = "testuser@curi.ooo",
    TEST_USER_PASSWORD = "testpassword123",
    POSTGRES_URL,
    VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    VITE_CURIO_URL,
  } = process.env;

  if (VITE_CURIO_URL && !VITE_CURIO_URL.startsWith("http://localhost")) {
    console.log("VITE_CURIO_URL is not localhost, skipping local seed.");
    return;
  }

  if (!POSTGRES_URL || !VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "Missing POSTGRES_URL, VITE_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY. Skipping seed.",
    );
    return;
  }

  const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId: string | null = null;
  const { data: usersData, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
  } else {
    const existing = usersData.users.find((u) => u.email === TEST_USER_EMAIL);
    if (existing) {
      userId = existing.id;
      await supabase.auth.admin.updateUserById(existing.id, {
        password: TEST_USER_PASSWORD,
        email_confirm: true,
      });
      console.log(`Updated test user (${TEST_USER_EMAIL}) password`);
    }
  }

  if (!userId) {
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
      });
    if (createError) {
      console.error("Error creating test user:", createError);
      return;
    }
    userId = createData.user.id;
    console.log(`Created test user (${TEST_USER_EMAIL})`);
  }

  try {
    const sql = postgres(POSTGRES_URL, { max: 1 });
    const slug = createUsernameSlug(TEST_USER_EMAIL);
    await sql`
      INSERT INTO profiles (user_id, username, is_enabled)
      VALUES (${userId}, ${slug}, true)
      ON CONFLICT (user_id) DO NOTHING;
    `;
    await sql.end();
    console.log("Ensured profile row exists for test user.");
  } catch (err) {
    console.warn("Could not insert profile:", err);
  }
}

main().catch(console.error);
