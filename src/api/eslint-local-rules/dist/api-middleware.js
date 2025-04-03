"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiMiddlewareRule = void 0;
// src/api/eslint-local-rules/api-middleware.ts
const utils_1 = require("@typescript-eslint/utils");
exports.apiMiddlewareRule = utils_1.ESLintUtils.RuleCreator.withoutDocs({
    meta: {
        type: "problem",
        messages: {
            missingDescribeRoute: "API route must use describeRoute middleware",
            missingZValidator: "API route must use zValidator middleware",
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.type === "MemberExpression" &&
                    ["get", "post", "put", "delete", "patch"].includes(node.callee.property.name)) {
                    // Check if this is a Hono router method
                    const object = node.callee.object;
                    const isHonoRoute = (object.type === "NewExpression" &&
                        object.callee.name === "Hono") ||
                        (object.type === "CallExpression" &&
                            object.callee.type === "MemberExpression" &&
                            ["get", "post", "put", "delete", "patch"].includes(object.callee.property.name));
                    console.log("-------------", isHonoRoute);
                    console.log(object);
                    if (isHonoRoute) {
                        const args = node.arguments;
                        const middlewares = args.slice(1);
                        let hasDescribeRoute = false;
                        let hasZValidator = false;
                        middlewares.forEach((middleware) => {
                            if (middleware.type === "CallExpression") {
                                const callee = middleware.callee;
                                if (callee.type === "Identifier") {
                                    if (callee.name === "describeRoute") {
                                        hasDescribeRoute = true;
                                    }
                                    if (callee.name === "zValidator") {
                                        hasZValidator = true;
                                    }
                                }
                            }
                        });
                        if (!hasDescribeRoute) {
                            context.report({
                                node,
                                messageId: "missingDescribeRoute",
                            });
                        }
                        if (!hasZValidator) {
                            context.report({
                                node,
                                messageId: "missingZValidator",
                            });
                        }
                    }
                }
            },
        };
    },
});
