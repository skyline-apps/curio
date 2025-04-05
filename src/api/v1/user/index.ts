import { Hono } from "hono";

import { userApiKeysRouter } from "./api-keys";
import { userApiKeysRevokeRouter } from "./api-keys/revoke";
import { userEmailRouter } from "./email";
import { userLabelsRouter } from "./labels";
import { userSettingsRouter } from "./settings";
import { userUsernameRouter } from "./username";

const userRouter = new Hono();

userRouter.route("/api-keys", userApiKeysRouter);
userRouter.route("/api-keys/revoke", userApiKeysRevokeRouter);
userRouter.route("/email", userEmailRouter);
userRouter.route("/labels", userLabelsRouter);
userRouter.route("/settings", userSettingsRouter);
userRouter.route("/username", userUsernameRouter);

export { userRouter };
