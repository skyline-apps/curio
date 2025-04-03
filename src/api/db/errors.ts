import { type DatabaseError } from "pg";

export type DbError = DatabaseError;

export enum DbErrorCode {
  Invalid = "invalid",
  Unknown = "unknown",
  ConnectionFailure = "08006",
  UniqueViolation = "23505",
}

export const checkDbError = (err: DbError): DbErrorCode => {
  if (!err.code) {
    return DbErrorCode.Invalid;
  }
  if (Object.values(DbErrorCode).includes(err.code as DbErrorCode)) {
    return err.code as DbErrorCode;
  }
  return DbErrorCode.Unknown;
};
