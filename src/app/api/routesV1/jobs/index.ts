import { Hono } from "hono";

import { importRouter } from "./import";

const jobsRouter = new Hono();

jobsRouter.route("/import", importRouter);

export { jobsRouter };
