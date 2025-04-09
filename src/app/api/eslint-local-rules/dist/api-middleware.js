"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiMiddlewareRule = void 0;
const utils_1 = require("@typescript-eslint/utils");
exports.apiMiddlewareRule = utils_1.ESLintUtils.RuleCreator.withoutDocs({
    meta: {
        type: "problem",
        messages: {
            missingDescribeRoute: "API route must use describeRoute middleware",
            missingZValidator: "API route must use zValidator middleware",
            missingParseError: "zValidator must include parseError as last argument",
            missingResponseValidation: "API route must validate response with ResponseSchema.parse()",
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        function checkRouteMethod(node) {
            if (node.callee.type !== "MemberExpression")
                return;
            const calleeProperty = node.callee.property;
            if (calleeProperty.type !== "Identifier")
                return;
            const methodName = calleeProperty.name;
            if (!["get", "post", "put", "delete", "patch"].includes(methodName))
                return;
            const args = node.arguments;
            if (args.length < 2)
                return;
            const handler = args[args.length - 1];
            let hasDescribeRoute = false;
            let hasZValidator = false;
            let hasParseError = false;
            // Check middlewares
            args.slice(1, -1).forEach((middleware) => {
                if (middleware.type !== "CallExpression")
                    return;
                const callee = middleware.callee;
                if (callee.type !== "Identifier")
                    return;
                if (callee.name === "describeRoute") {
                    hasDescribeRoute = true;
                }
                if (callee.name === "zValidator") {
                    hasZValidator = true;
                    // Check if last argument is parseError (direct or as generic type parameter)
                    if (middleware.arguments.length > 0) {
                        const lastArg = middleware.arguments[middleware.arguments.length - 1];
                        // Handle both direct parseError and parseError<...> cases
                        if ((lastArg.type === "Identifier" &&
                            lastArg.name === "parseError") ||
                            (lastArg.type === "TSInstantiationExpression" &&
                                lastArg.expression.type === "Identifier" &&
                                lastArg.expression.name === "parseError")) {
                            hasParseError = true;
                        }
                    }
                }
            });
            // Check handler for response validation
            if (handler.type === "ArrowFunctionExpression" ||
                handler.type === "FunctionExpression") {
                let hasResponseValidation = false;
                // Get the full text of the handler
                const handlerText = context.getSourceCode().getText(handler);
                // Simple check for ResponseSchema.parse(
                if (handlerText.includes("ResponseSchema.parse(")) {
                    hasResponseValidation = true;
                }
                if (!hasResponseValidation) {
                    context.report({
                        node,
                        messageId: "missingResponseValidation",
                    });
                }
            }
            if (!hasDescribeRoute) {
                context.report({
                    node,
                    messageId: "missingDescribeRoute",
                });
            }
            if (hasZValidator && !hasParseError) {
                context.report({
                    node,
                    messageId: "missingParseError",
                });
            }
            else if (!hasZValidator) {
                context.report({
                    node,
                    messageId: "missingZValidator",
                });
            }
        }
        return {
            CallExpression(node) {
                checkRouteMethod(node);
                // Handle chained routes
                if (node.callee.type === "MemberExpression" &&
                    node.callee.object.type === "CallExpression") {
                    checkRouteMethod(node.callee.object);
                }
            },
        };
    },
});
