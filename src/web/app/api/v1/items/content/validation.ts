import { z } from "zod";

import { ItemResultSchema } from "@/app/api/v1/items/validation";

export enum UploadStatus {
  UPDATED_MAIN = "UPDATED_MAIN",
  STORED_VERSION = "STORED_VERSION",
  SKIPPED = "SKIPPED",
  ERROR = "ERROR",
}

export const GetItemContentRequestSchema = z.object({
  slug: z.string().describe("The unique slug of the item to retrieve."),
});

export const GetItemContentResponseSchema = z.union([
  z.object({
    content: z.string().optional(),
    item: ItemResultSchema,
  }),
  z.object({
    error: z.string(),
  }),
]);

export type GetItemContentResponse = z.infer<
  typeof GetItemContentResponseSchema
>;

export const UpdateItemContentRequestSchema = z.object({
  htmlContent: z
    .string()
    .describe(
      "The HTML content for the item. Will replace the existing content only if it's longer.",
    ),
  url: z.string().describe("The URL of the item to update."),
  skipMetadataExtraction: z.boolean().optional().default(false),
});

export const UpdateItemContentResponseSchema = z.discriminatedUnion("status", [
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

export type UpdateItemContentResponse = z.infer<
  typeof UpdateItemContentResponseSchema
>;
