// eslint-disable-next-line no-restricted-imports
import { NextRequest, NextResponse } from "next/server";

export type APIRequest = NextRequest;

interface APIResponseJsonError extends NextResponse {
  error?: string;
}

export type APIResponse<T = unknown> =
  | APIResponseJsonError
  | (NextResponse & T);

export const APIResponseJSON = NextResponse.json;

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.status < 200 || response.status >= 300) {
    const error = await response.json();
    throw new Error(error.error);
  }
  const result = await response.json();
  return result;
}
