import { Hono } from "hono";

import { itemsRouter } from "./items";

const v1Router = new Hono();

v1Router.route("/items", itemsRouter);

export { v1Router };
