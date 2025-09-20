import { Hono } from "hono";

import { staticPrivacyRouter } from "./privacy";

const staticRouter = new Hono();

staticRouter.route("/privacy", staticPrivacyRouter);

export { staticRouter };
