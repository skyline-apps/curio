import { z } from "zod";

export const dateType = z
  .union([z.string(), z.date()])
  .transform((val) => {
    if (val instanceof Date) {
      return val.toISOString();
    }
    return val;
  })
  .pipe(z.string());

export const dateTypeOptional = z
  .union([z.string(), z.date(), z.null()])
  .transform((val) => {
    if (val instanceof Date) {
      return val.toISOString();
    }
    return val || undefined;
  })
  .pipe(z.string().optional());

export enum UploadStatus {
  UPDATED_MAIN = "UPDATED_MAIN",
  STORED_VERSION = "STORED_VERSION",
  SKIPPED = "SKIPPED",
  ERROR = "ERROR",
}

export const FALLBACK_HOSTNAME = "curio-newsletter";
