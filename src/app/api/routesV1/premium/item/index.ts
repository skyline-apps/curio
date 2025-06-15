import { Hono } from "hono";

import { contextRouter } from "./context";
import { summaryRouter } from "./summary";

const itemRouter = new Hono();

itemRouter.route("/summary", summaryRouter);
itemRouter.route("/context", contextRouter);

export { itemRouter };
