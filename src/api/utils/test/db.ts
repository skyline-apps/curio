/* eslint-disable no-restricted-imports */
import * as schema from "@api/db/schema";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// Create a test database that extends the drizzle database with additional test properties
export type TestDatabase = DrizzleDb & {
  db: DrizzleDb;
  connection: PGlite;
  raw: PGlite;
};

export async function createTestDb(): Promise<TestDatabase> {
  // Create a new in-memory PGlite instance
  const client = new PGlite();

  // Register UUID function
  client.query(
    `CREATE OR REPLACE FUNCTION gen_random_uuid() RETURNS uuid AS $$ BEGIN RETURN '${uuidv4()}'; END; $$ LANGUAGE plpgsql;`,
  );

  // Create auth schema
  client.query(`CREATE SCHEMA IF NOT EXISTS auth;`);

  // Create users table
  client.query(`CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    email TEXT UNIQUE NOT NULL
  );`);

  // Create our drizzle database instance
  const drizzleDb = drizzle<typeof schema>(client, { schema });

  // Run migrations
  await migrate(drizzleDb, {
    migrationsFolder: join(__dirname, "../../db/migrations"),
  });

  // Create test database instance that combines drizzle methods with test utilities
  const testDb = Object.assign(drizzleDb, {
    db: drizzleDb,
    connection: client,
    raw: client,
  });

  return testDb;
}
