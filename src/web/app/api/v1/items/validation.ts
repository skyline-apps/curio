import { z } from "zod";

export const ItemMetadataSchema = z.object({
  url: z.string().url(),
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  thumbnail: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
});

export const CreateOrUpdateItemsRequestSchema = z.object({
  items: z.array(ItemMetadataSchema),
});

export const GetItemsRequestSchema = z.object({
  // TODO: Add description here and pass through to OpenAPI schema
  slugs: z
    .string()
    .optional()
    .superRefine((val) => {
      if (val && !val.split(",").every((s) => s.trim().length > 0)) {
        throw new Error("Invalid slug format");
      }
    })
    .describe(
      "A comma-separated list of slugs to retrieve. If the slug is not found, it will be ignored.",
    ),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  cursor: z.string().optional(),
});

export type ItemMetadata = z.infer<typeof ItemMetadataSchema>;
export type CreateOrUpdateItemsRequest = z.infer<
  typeof CreateOrUpdateItemsRequestSchema
>;
export type GetItemsRequest = z.infer<typeof GetItemsRequestSchema>;

export interface ItemResponse extends ItemMetadata {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetItemsResponse {
  items: ItemResponse[];
  nextCursor?: string;
  total: number;
}

export interface CreateOrUpdateItemsResponse {
  items: ItemResponse[];
  errors?: Array<{
    url: string;
    error: string;
  }>;
}
