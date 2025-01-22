import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { existsSync } from "fs";
import path from "path";

export const apiValidationRule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "problem",
    messages: {
      missingValidationFile:
        "API route must have a corresponding validation.ts file",
      missingRequestSchema:
        "{{ method }} handler must use a request schema from validation.ts with parseAPIRequest",
      missingResponseType:
        "API route handler must use a response type from validation.ts",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Cache for validation imports to avoid checking multiple times
    let validationImports: string[] | null = null;

    function getValidationImports(_node: TSESTree.Node): string[] {
      if (validationImports === null) {
        validationImports = [];
        const program = context.getSourceCode().ast;

        // Find all imports from validation.ts
        program.body.forEach((node) => {
          if (
            node.type === "ImportDeclaration" &&
            node.source.value.endsWith("/validation")
          ) {
            node.specifiers.forEach((spec) => {
              if (spec.type === "ImportSpecifier") {
                validationImports!.push(spec.local.name);
              }
            });
          }
        });
      }
      return validationImports;
    }

    function findFunctionBody(node: TSESTree.Node): string {
      return context.getSourceCode().getText(node);
    }

    function getWrappedFunction(
      node: TSESTree.Node,
    ): TSESTree.ArrowFunctionExpression | null {
      if (
        node.type !== "CallExpression" ||
        node.callee.type !== "Identifier" ||
        node.callee.name !== "withAuth" ||
        !node.arguments.length
      ) {
        return null;
      }
      const firstArg = node.arguments[0];
      return firstArg.type === "ArrowFunctionExpression" ? firstArg : null;
    }

    function hasValidResponseType(
      node: TSESTree.Node,
      imports: string[],
    ): boolean {
      const functionText = context.getSourceCode().getText(node);
      const responseSchemas = imports.filter((name) =>
        name.includes("Response"),
      );

      // Check for direct response type usage
      const hasDirectType = responseSchemas.some((schema) =>
        functionText.includes(`Promise<APIResponse<${schema}>`),
      );

      // Check for z.infer<typeof ResponseSchema> usage
      const hasInferType = responseSchemas.some((schema) =>
        functionText.includes(`Promise<APIResponse<z.infer<typeof ${schema}>`),
      );

      return hasDirectType || hasInferType;
    }

    function hasNoRequestComment(node: TSESTree.Node): boolean {
      const sourceCode = context.getSourceCode();
      const comments = sourceCode.getCommentsBefore(node);
      return comments.some(
        (comment) =>
          comment.value.replace(/^\s*\*\s*/gm, "").trim() === "@no-request",
      );
    }

    function hasValidRequestSchema(
      node: TSESTree.FunctionDeclaration,
      exportNode: TSESTree.ExportNamedDeclaration,
      imports: string[],
    ): boolean {
      // Check for @no-request comment on either node
      if (hasNoRequestComment(node) || hasNoRequestComment(exportNode)) {
        return true;
      }

      const functionBody = findFunctionBody(node);
      const requestSchemas = imports.filter((name) =>
        name.endsWith("RequestSchema"),
      );

      // Check for parseAPIRequest usage with schema
      const hasParseAPIRequest = requestSchemas.some(
        (schema) =>
          functionBody.includes(`parseAPIRequest`) &&
          functionBody.includes(`${schema},`),
      );

      // Check for direct schema usage (e.g., schema.parse)
      const hasDirectUsage = requestSchemas.some(
        (schema) =>
          functionBody.includes(`${schema}.`) || // Check for schema usage (e.g., schema.parse)
          functionBody.includes(`${schema})`),
      ); // Check for schema reference

      return hasParseAPIRequest || hasDirectUsage;
    }

    return {
      // Match both direct function declarations and withAuth wrapped functions
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        const filename = context.getFilename();
        if (!filename.includes("/api/") || !filename.endsWith("route.ts")) {
          return;
        }

        // Check if validation.ts exists in the same directory
        const validationPath = path.join(
          path.dirname(filename),
          "validation.ts",
        );
        if (!existsSync(validationPath)) {
          context.report({
            node,
            messageId: "missingValidationFile",
          });
          return;
        }

        let functionNode: TSESTree.Node | null = null;
        let httpMethod = "";

        // Handle direct function declarations
        if (node.declaration?.type === "FunctionDeclaration") {
          functionNode = node.declaration;
          httpMethod = node.declaration.id?.name || "";
        }
        // Handle withAuth wrapped functions
        else if (
          node.declaration?.type === "VariableDeclaration" &&
          node.declaration.declarations[0]?.init?.type === "CallExpression"
        ) {
          const wrappedFunction = getWrappedFunction(
            node.declaration.declarations[0].init,
          );
          if (wrappedFunction) {
            functionNode = wrappedFunction;
            const id = node.declaration.declarations[0].id;
            httpMethod = id.type === "Identifier" ? id.name : "";
          }
        }

        if (!functionNode || !httpMethod) return;

        // Get all validation imports and function body
        const imports = getValidationImports(functionNode);

        // Check request schema usage
        if (
          !hasValidRequestSchema(
            functionNode as TSESTree.FunctionDeclaration,
            node,
            imports,
          )
        ) {
          context.report({
            node: functionNode,
            messageId: "missingRequestSchema",
            data: {
              method: httpMethod,
            },
          });
        }

        // Check return type
        if (!hasValidResponseType(functionNode, imports)) {
          context.report({
            node: functionNode,
            messageId: "missingResponseType",
          });
        }
      },
    };
  },
});
