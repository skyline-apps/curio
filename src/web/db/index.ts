import postgres, { type PostgresError } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema });

export { eq, lt, gt, lte, gte, ne } from "drizzle-orm";

export type DbError = PostgresError;

export enum DbErrorCode {
  Invalid = "invalid",
  Unknown = "unknown",
  UniqueViolation = "23505",
}

export const checkDbError = (err: PostgresError): DbErrorCode => {
  if (!err.code) {
    return DbErrorCode.Invalid;
  }
  if (Object.values(DbErrorCode).includes(err.code as DbErrorCode)) {
    return err.code as DbErrorCode;
  }
  return DbErrorCode.Unknown;
};
