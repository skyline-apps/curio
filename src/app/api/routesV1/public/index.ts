import { Hono } from "hono";

import { publicItemsContentRouter } from "./items/content";
import { publicItemsEmailRouter } from "./items/email";
import { publicProfileRouter } from "./profile";
import { revenuecatRouter } from "./subscriptions/revenuecat";

const publicRouter = new Hono();

publicRouter.route("/items/content", publicItemsContentRouter);
publicRouter.route("/items/email", publicItemsEmailRouter);
publicRouter.route("/profile", publicProfileRouter);
publicRouter.route("/subscriptions/revenuecat", revenuecatRouter);

export { publicRouter };
