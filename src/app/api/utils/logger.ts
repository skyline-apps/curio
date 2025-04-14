import { EnvContext } from "@app/api/utils/env";
import { Axiom } from "@axiomhq/js";
import {
  AxiomJSTransport,
  ConsoleTransport,
  Logger as AxiomLogger,
  LogLevel,
} from "@axiomhq/logging";

export type Logger = AxiomLogger;

export const createLogger = (
  c: EnvContext,
  logLevel: LogLevel = "info",
): AxiomLogger => {
  const hasAxiom = !!c.env.AXIOM_DATASET && !!c.env.AXIOM_TOKEN;

  return new AxiomLogger({
    transports: [
      new ConsoleTransport({
        logLevel,
        prettyPrint: true,
      }),
      ...(hasAxiom
        ? [
            new AxiomJSTransport({
              axiom: new Axiom({
                token: c.env.AXIOM_TOKEN,
              }),
              dataset: c.env.AXIOM_DATASET,
              logLevel,
            }),
          ]
        : []),
    ],
  });
};
