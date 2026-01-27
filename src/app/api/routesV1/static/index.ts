import { Hono } from "hono";

import { staticDocsRouter } from "./docs";
import { staticPrivacyRouter } from "./privacy";
import { staticTermsRouter } from "./terms";

const staticRouter = new Hono();

staticRouter.route("/privacy", staticPrivacyRouter);
staticRouter.route("/terms", staticTermsRouter);
staticRouter.route("/docs", staticDocsRouter);

export { staticRouter };
