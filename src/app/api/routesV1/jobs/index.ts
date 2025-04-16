import { Hono } from "hono";

import { importInstapaperRouter } from "./import/instapaper";

const jobsRouter = new Hono();

jobsRouter.route("/import/instapaper", importInstapaperRouter);

export { jobsRouter };
