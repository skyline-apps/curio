/* eslint-disable no-restricted-imports */
import * as schema from "@api/db/schema";
import { type EnvContext } from "@api/utils/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let pool: Pool | null = null;
export type TransactionDB = NodePgDatabase<typeof schema>;

export function getDb(c: EnvContext): TransactionDB {
  if (!pool) {
    pool = new Pool({
      connectionString: c.env.POSTGRES_URL,
    });
  }
  return drizzle(pool, { schema });
}

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
