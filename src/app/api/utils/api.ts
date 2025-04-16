/* eslint-disable no-restricted-imports */
import { EnvContext } from "@app/api/utils/env";
import { TypedResponse, ValidationTargets } from "hono";
import { DescribeRouteOptions } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { ZodError, ZodType } from "zod";

export { describeRoute } from "hono-openapi";
export { validator as zValidator } from "hono-openapi/zod";

export type APIRequest = Request;

export interface ErrorResponse {
  error?: string;
}

type APIResponseJsonError = TypedResponse & ErrorResponse;

export type APIResponse<T = unknown> =
  | APIResponseJsonError
  | (TypedResponse & T);

type ParseError<O> =
  | Response
  | void
  | TypedResponse<O>
  | Promise<Response | void | TypedResponse<O>>;

export const parseError = <T, O>(
  result: (
    | { success: true; data: T }
    | { success: false; error: ZodError; data: T }
  ) & {
    target: keyof ValidationTargets;
  },
  c: EnvContext,
): ParseError<O> => {
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
  request: ZodType | null,
  response: ZodType,
): DescribeRouteOptions => {
  return {
    ...(request
      ? {
          request:
            method === "get"
              ? {
                  query: resolver(request),
                }
              : {
                  json: resolver(request),
                },
        }
      : {}),
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
