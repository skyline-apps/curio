import { Hono } from "hono";

import { publicItemsContentRouter } from "./items/content";
import { publicItemsEmailRouter } from "./items/email";
import { publicProfileRouter } from "./profile";

const publicRouter = new Hono();

publicRouter.route("/items/content", publicItemsContentRouter);
publicRouter.route("/items/email", publicItemsEmailRouter);
publicRouter.route("/profile", publicProfileRouter);

export { publicRouter };
