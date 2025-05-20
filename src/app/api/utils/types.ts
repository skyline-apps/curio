import { z } from "zod";

export { type ContentfulStatusCode } from "hono/utils/http-status";

export const dateType = z
  .union([z.string(), z.date()])
  .transform((val) => {
    if (val instanceof Date) {
      return val.toISOString();
    }
    return val;
  })
  .pipe(z.string());
