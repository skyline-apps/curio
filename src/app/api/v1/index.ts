import { Hono } from "hono";

import { itemsRouter } from "./items";
import { itemsContentRouter } from "./items/content";
import { itemsFavoriteRouter } from "./items/favorite";
import { itemsHighlightRouter } from "./items/highlights";
import { itemsLabelsRouter } from "./items/labels";
import { itemsReadRouter } from "./items/read";
import { itemsRecommendedRouter } from "./items/recommended";
import { itemsSaveRouter } from "./items/save";
import { itemsStateRouter } from "./items/state";
import { publicRouter } from "./public";
import { userRouter } from "./user";

const v1Router = new Hono();

v1Router.route("/items", itemsRouter);
v1Router.route("/items/content", itemsContentRouter);
v1Router.route("/items/favorite", itemsFavoriteRouter);
v1Router.route("/items/highlights", itemsHighlightRouter);
v1Router.route("/items/labels", itemsLabelsRouter);
v1Router.route("/items/read", itemsReadRouter);
v1Router.route("/items/recommended", itemsRecommendedRouter);
v1Router.route("/items/save", itemsSaveRouter);
v1Router.route("/items/state", itemsStateRouter);

v1Router.route("/public", publicRouter);
v1Router.route("/user", userRouter);

export { v1Router };
