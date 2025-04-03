import { EnvContext } from "@api/utils/env";
import { TypedResponse, ValidationTargets } from "hono";
import { DescribeRouteOptions } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { ZodError, ZodType } from "zod";

export type APIRequest = Request;

interface APIResponseJsonError extends TypedResponse {
  error?: string;
}

export type APIResponse<T = unknown> =
  | APIResponseJsonError
  | (TypedResponse & T);

export const parseError = <T, O>(
  result: (
    | { success: true; data: T }
    | { success: false; error: ZodError; data: T }
  ) & {
    target: keyof ValidationTargets;
  },
  c: EnvContext,
):
  | Response
  | void
  | TypedResponse<O>
  | Promise<Response | void | TypedResponse<O>> => {
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path =
        issue.path.length !== undefined ? issue.path.join(".") : issue.path;
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    const message = errors.join("\n");
    return c.json({ error: `Invalid request parameters:\n${message}` }, 400);
  }
};

export const apiDoc = (
  method: "get" | "post" | "put" | "delete",
  request: ZodType,
  response: ZodType,
): DescribeRouteOptions => {
  return {
    request:
      method === "get"
        ? {
            query: resolver(request),
          }
        : {
            json: resolver(request),
          },
    responses: {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: resolver(response),
          },
        },
      },
      400: {
        description: "Invalid request",
      },
      401: {
        description: "Unauthorized",
      },
      500: {
        description: "Internal server error",
      },
    },
  };
};
