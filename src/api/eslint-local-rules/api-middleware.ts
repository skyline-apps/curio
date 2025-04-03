import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

export const apiMiddlewareRule = ESLintUtils.RuleCreator.withoutDocs({
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
        if (
          node.callee.type === "MemberExpression" &&
          ["get", "post", "put", "delete", "patch"].includes(
            (node.callee.property as TSESTree.Identifier).name,
          )
        ) {
          // Check if this is a Hono router method
          const object = node.callee.object;
          const isHonoRoute =
            (object.type === "NewExpression" &&
              (object.callee as TSESTree.Identifier).name === "Hono") ||
            (object.type === "CallExpression" &&
              object.callee.type === "MemberExpression" &&
              ["get", "post", "put", "delete", "patch"].includes(
                (object.callee.property as TSESTree.Identifier).name,
              ));

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
