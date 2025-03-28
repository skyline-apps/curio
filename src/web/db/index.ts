/* eslint-disable no-restricted-imports */
import * as schema from "@web/db/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const db = drizzle(pool, { schema });

export type { InferSelectModel, SQL } from "drizzle-orm";
export {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  is,
  isNull,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";
export type {
  PgColumn,
  PgSelect,
  PgTransaction,
  SelectedFields,
} from "drizzle-orm/pg-core";
export type TransactionDB = NodePgDatabase<typeof schema>;
