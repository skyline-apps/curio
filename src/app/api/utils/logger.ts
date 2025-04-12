import { EnvContext } from "@app/api/utils/env";
import { Axiom } from "@axiomhq/js";
import {
  AxiomJSTransport,
  ConsoleTransport,
  Logger as AxiomLogger,
} from "@axiomhq/logging";

export type Logger = AxiomLogger;

export const createLogger = (c: EnvContext): AxiomLogger => {
  const hasAxiom = !!c.env.AXIOM_DATASET && !!c.env.AXIOM_TOKEN;

  return new AxiomLogger({
    transports: [
      new ConsoleTransport({
        logLevel: "info",
        prettyPrint: true,
      }),
      ...(hasAxiom
        ? [
            new AxiomJSTransport({
              axiom: new Axiom({
                token: c.env.AXIOM_TOKEN,
              }),
              dataset: c.env.AXIOM_DATASET,
              logLevel: "info",
            }),
          ]
        : []),
    ],
  });
};
