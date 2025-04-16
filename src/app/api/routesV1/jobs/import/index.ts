import { Hono } from "hono";

import { importInstapaperRouter } from "./instapaper";

const importRouter = new Hono();

importRouter.route("/instapaper", importInstapaperRouter);

export { importRouter };
