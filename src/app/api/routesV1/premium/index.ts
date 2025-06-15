import { premiumMiddleware } from "@app/api/middleware/premium";
import { Hono } from "hono";

import { itemRouter } from "./item";

const premiumRouter = new Hono();
premiumRouter.use("*", premiumMiddleware);
premiumRouter.route("/item", itemRouter);

export { premiumRouter };
