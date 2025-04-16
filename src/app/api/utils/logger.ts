import { Axiom } from "@axiomhq/js";
import {
  AxiomJSTransport,
  ConsoleTransport,
  Logger as AxiomLogger,
  LogLevel,
} from "@axiomhq/logging";

export type Logger = AxiomLogger;

export type LoggerEnv = { AXIOM_DATASET?: string; AXIOM_TOKEN?: string };

export const createLogger = (
  env: LoggerEnv,
  logLevel: LogLevel = "info",
): AxiomLogger => {
  const hasAxiom = !!env.AXIOM_DATASET && !!env.AXIOM_TOKEN;

  return new AxiomLogger({
    transports: [
      hasAxiom
        ? new AxiomJSTransport({
            axiom: new Axiom({
              token: env.AXIOM_TOKEN!,
            }),
            dataset: env.AXIOM_DATASET!,
            logLevel,
          })
        : new ConsoleTransport({
            logLevel,
            prettyPrint: true,
          }),
    ],
  });
};
