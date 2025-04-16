/* eslint-disable no-restricted-imports */
import * as schema from "@app/api/db/schema";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type TransactionDB = PostgresJsDatabase<typeof schema>;
export type DBEnv = { POSTGRES_URL: string };

export function getDb(env: DBEnv): TransactionDB {
  const client = postgres(env.POSTGRES_URL, {
    /* options like max: 1 */
  });
  return drizzle(client, { schema });
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
