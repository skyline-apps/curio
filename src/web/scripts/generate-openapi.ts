import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import fs from "fs/promises";
import { glob } from "glob";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extend Zod with OpenAPI functionality
extendZodWithOpenApi(z);

interface ValidationModule {
  [key: string]: z.ZodType | unknown;
}

interface RouteInfo {
  method: string;
  hasRequestValidation: boolean;
  requestType?: string;
  responseType?: string;
}

function isZodType(value: unknown): value is z.ZodType {
  return value instanceof z.ZodType;
}

function createRouteParameter(schema: z.ZodType): z.ZodObject<{
  [x: string]: z.ZodType;
}> {
  if (schema instanceof z.ZodObject) {
    return schema;
  }
  // If it's not already an object schema, wrap it in one
  return z.object({ value: schema });
}

// Initialize OpenAPI registry with schema configuration
function initializeRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();

  // Add any global schema configurations here
  const ErrorSchema = z.object({
    error: z.string().describe("Error message"),
  });
  registry.register("Error", ErrorSchema);

  return registry;
}

async function getRouteInfo(routePath: string): Promise<RouteInfo[]> {
  const content = await fs.readFile(routePath, "utf-8");
  const routes: RouteInfo[] = [];

  // Look for exported HTTP method functions and parseAPIRequest calls
  const methodRegex =
    /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g;
  const noRequestRegex = /\/\*\*\s*@no-request\s*\*\//;
  const responseTypeRegex = /Promise<APIResponse<(\w+)>>/;
  const parseRequestRegex = /parseAPIRequest\(\s*(\w+)RequestSchema\s*,/;

  let match;
  let lastCommentBlock = "";
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track comment blocks
    if (line.includes("/**")) {
      lastCommentBlock = "";
      while (i < lines.length && !lines[i].includes("*/")) {
        lastCommentBlock += lines[i] + "\n";
        i++;
      }
      lastCommentBlock += lines[i];
      continue;
    }

    // Check for method declaration
    methodRegex.lastIndex = 0;
    if ((match = methodRegex.exec(line)) !== null) {
      const method = match[1];

      // Look ahead for response type and request schema
      let functionBlock = "";
      let j = i;
      let bracketCount = 0;
      let foundOpenBracket = false;

      while (j < lines.length) {
        functionBlock += lines[j] + "\n";
        if (lines[j].includes("{")) {
          foundOpenBracket = true;
          bracketCount++;
        }
        if (lines[j].includes("}")) {
          bracketCount--;
        }
        if (foundOpenBracket && bracketCount === 0) break;
        j++;
      }

      // Look for response type
      const responseMatch = functionBlock.match(responseTypeRegex);
      const responseType = responseMatch ? responseMatch[1] : undefined;

      // Look for request type in parseAPIRequest
      const requestMatch = functionBlock.match(parseRequestRegex);
      const requestType = requestMatch ? requestMatch[1] : undefined;

      const hasRequestValidation = !noRequestRegex.test(lastCommentBlock);

      routes.push({
        method,
        hasRequestValidation,
        requestType: requestType || undefined,
        responseType: responseType || undefined,
      });
    }
  }

  return routes;
}

// Function to convert path to API endpoint
function pathToEndpoint(filePath: string): string {
  // Remove base path and validation.ts
  const relativePath = filePath
    .replace(/.*\/app\/api\//, "")
    .replace(/\/route\.ts$/, "");

  // Convert [param] to {param}
  const endpoint = relativePath.replace(/\[([^\]]+)\]/g, "{$1}");

  return `/api/${endpoint}`;
}

async function generateOpenAPI(): Promise<void> {
  // Create OpenAPI registry
  const registry = initializeRegistry();

  // Get all route files
  const routeFiles = glob.sync("../app/api/**/route.ts", {
    cwd: __dirname,
    absolute: true,
  });

  // Process each route file
  for (const routePath of routeFiles) {
    const endpoint = pathToEndpoint(routePath);
    const routes = await getRouteInfo(routePath);

    // Get validation module if it exists
    const validationPath = routePath.replace(/route\.ts$/, "validation.ts");
    let validationModule: ValidationModule | undefined;
    try {
      const mod = await import(validationPath);
      validationModule = mod;
    } catch {
      // No validation module found
    }

    // Process each route method
    for (const route of routes) {
      let requestSchema: z.ZodType | undefined;
      let responseSchema: z.ZodType | undefined;

      if (validationModule) {
        // Try to get request schema
        if (route.requestType) {
          const requestSchemaName = `${route.requestType}RequestSchema`;
          const schema = validationModule[requestSchemaName];
          if (isZodType(schema)) {
            requestSchema = schema;
          }
        }

        // Try to get response schema
        if (route.responseType) {
          const responseSchemaName = `${route.responseType}Schema`;
          const schema = validationModule[responseSchemaName];
          if (isZodType(schema)) {
            responseSchema = schema;
          }
        }
      }

      const tag = endpoint.split("/")[2].toUpperCase();

      const config: RouteConfig = {
        method: route.method.toLowerCase() as
          | "get"
          | "post"
          | "put"
          | "patch"
          | "delete",
        path: endpoint,
        description: `${route.method} ${endpoint}`,
        tags: [tag],
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: responseSchema || z.any(),
              },
            },
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: z.object({
                  error: z.string().describe("Error message"),
                }),
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: z.object({
                  error: z.string().describe("Error message"),
                }),
              },
            },
          },
        },
      };

      // Add request schema if present
      if (requestSchema) {
        if (route.method === "GET") {
          config.request = {
            query: createRouteParameter(requestSchema),
          };
        } else {
          config.request = {
            body: {
              description: "Request body",
              required: true,
              content: {
                "application/json": {
                  schema: requestSchema,
                },
              },
            },
          };
        }
      }

      registry.registerPath(config);
    }
  }

  // Generate OpenAPI document
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const openApiDocument = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Curio API",
      version: "1.0.0",
      description: "API documentation for Curio",
    },
    servers: [{ url: process.env.NEXT_PUBLIC_CURIO_URL || "" }],
  });

  const outputPath = path.join(process.cwd(), "public", "openapi.json");

  // Ensure the public directory exists
  if (!(await fs.stat(path.join(process.cwd(), "public"))).isDirectory()) {
    await fs.mkdir(path.join(process.cwd(), "public"));
  }

  // Generate and write the OpenAPI spec
  await fs.writeFile(outputPath, JSON.stringify(openApiDocument, null, 2));
}

// Run the generation
generateOpenAPI().catch(console.error);
