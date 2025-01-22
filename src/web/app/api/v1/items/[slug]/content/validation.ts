import { z } from "zod";

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
    content: z.string(),
    itemId: z.string(),
  }),
  z.object({
    error: z.string(),
  }),
]);

export type GetItemContentResponse = z.infer<
  typeof GetItemContentResponseSchema
>;

export const UpdateItemContentRequestSchema = z.object({
  content: z
    .string()
    .describe(
      "The new content for the item. Will replace the existing content only if it's longer.",
    ),
  slug: z.string().describe("The unique slug of the item to update."),
});

export const UpdateItemContentResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal(UploadStatus.UPDATED_MAIN),
    itemId: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.STORED_VERSION),
    itemId: z.string(),
    message: z.string(),
  }),
  z.object({
    status: z.literal(UploadStatus.SKIPPED),
    itemId: z.string(),
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
