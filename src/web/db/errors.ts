// eslint-disable-next-line no-restricted-imports
import { type PostgresError } from "postgres";

export type DbError = PostgresError;

export enum DbErrorCode {
  Invalid = "invalid",
  Unknown = "unknown",
  ConnectionFailure = "08006",
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
