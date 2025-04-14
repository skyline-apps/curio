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

const time = (delta: number): string => {
  return humanize([
    delta < 1000 ? delta + "ms" : Math.round(delta / 1000) + "s",
  ]);
};

type PrintFunc = (str: string, data: Record<string, unknown>) => void;

function log(
  fn: PrintFunc,
  includeMetadata: boolean,
  prefix: string,
  method: string,
  path: string,
  profileId?: string,
  status?: number,
  elapsedMs?: number,
): void {
  const out =
    prefix === LogPrefix.Incoming
      ? `${prefix} ${method} ${path}`
      : `${prefix} ${method} ${path} ${status} ${time(elapsedMs ?? 0)}`;
  fn(
    out,
    includeMetadata
      ? {
          profileId,
          method,
          path,
          status,
          elapsedMs,
        }
      : {},
  );
}

export const requestLogger = (): MiddlewareHandler => {
  return async function logger(c, next) {
    const { method, path } = c.req;
    if (path === "/api/health") {
      return await next();
    }
    const usingAxiom = !!c.env.AXIOM_TOKEN;
    const logDisabled = c.req.header("x-healthcheck") === "true";
    const logger = createLogger(c, logDisabled ? "warn" : "info");

    c.set("log", logger);

    if (!logDisabled) {
      log(logger.info, usingAxiom, LogPrefix.Incoming, method, path);
    }

    const start = Date.now();

    await next();

    let logFn = logger.warn;

    if (c.res.status === 200) {
      logFn = logger.info;
    } else if (c.res.status >= 500) {
      logFn = logger.error;
    }

    const delta = Date.now() - start;
    if (!logDisabled || (logDisabled && c.res.status !== 200)) {
      log(
        logFn,
        usingAxiom,
        LogPrefix.Outgoing,
        method,
        path,
        c.get("profileId"),
        c.res.status,
        delta,
      );
    }

    if (typeof logger.flush === "function") {
      await logger.flush();
    }
  };
};
