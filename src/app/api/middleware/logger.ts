import { createLogger } from "@app/api/utils/logger";
import type { MiddlewareHandler } from "hono";

enum LogPrefix {
  Outgoing = "-->",
  Incoming = "<--",
  Error = "xxx",
}

const humanize = (times: string[]): string => {
  const [delimiter, separator] = [",", "."];

  const orderTimes = times.map((v) =>
    v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter),
  );

  return orderTimes.join(separator);
};

const time = (start: number): string => {
  const delta = Date.now() - start;
  return humanize([
    delta < 1000 ? delta + "ms" : Math.round(delta / 1000) + "s",
  ]);
};

type PrintFunc = (str: string) => void;

function log(
  fn: PrintFunc,
  prefix: string,
  method: string,
  path: string,
  status: number = 0,
  elapsed?: string,
): void {
  const out =
    prefix === LogPrefix.Incoming
      ? `${prefix} ${method} ${path}`
      : `${prefix} ${method} ${path} ${status} ${elapsed}`;
  fn(out);
}

export const requestLogger = (): MiddlewareHandler => {
  return async function logger(c, next) {
    const axiomLogger = createLogger(c);
    const logFn = axiomLogger.info;
    const { method, url } = c.req;

    const path = url.slice(url.indexOf("/", 8));

    log(logFn, LogPrefix.Incoming, method, path);

    const start = Date.now();

    await next();

    log(logFn, LogPrefix.Outgoing, method, path, c.res.status, time(start));

    if (typeof axiomLogger.flush === "function") {
      await axiomLogger.flush();
    }
  };
};
