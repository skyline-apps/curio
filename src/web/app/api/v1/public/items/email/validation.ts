import { z } from "zod";

import { UploadStatus } from "@web/lib/storage/types";

export const UploadEmailRequestSchema = z.object({
  emailBody: z.string().describe("The email body content, base64-encoded"),
});

export type UploadEmailRequest = z.infer<typeof UploadEmailRequestSchema>;

export const UploadEmailResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal(UploadStatus.UPDATED_MAIN),
    slug: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.STORED_VERSION),
    slug: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.SKIPPED),
    slug: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.ERROR),
    error: z.string(),
  }),
]);

export type UploadEmailResponse = z.infer<typeof UploadEmailResponseSchema>;
