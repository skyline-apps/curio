/* eslint-disable no-restricted-imports */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const db = drizzle(pool, { schema });

export { and, eq, gt, gte, lt, lte, ne, sql } from "drizzle-orm";
export type { PgColumn, SelectedFields } from "drizzle-orm/pg-core";
