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
  slugs: z
    .string()
    .transform((str) => str.split(","))
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
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
