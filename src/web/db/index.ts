/* eslint-disable no-restricted-imports */
import { drizzle } from "drizzle-orm/node-postgres";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const db = drizzle(pool, { schema });

export type { SQL } from "drizzle-orm";
export {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  is,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";
export type {
  PgColumn,
  PgTransaction,
  SelectedFields,
} from "drizzle-orm/pg-core";
export type TransactionDB = NodePgDatabase<typeof schema>;
