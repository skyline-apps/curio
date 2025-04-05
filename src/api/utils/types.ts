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
