import { z } from "zod";

const UrlSchema = z.string().url().describe("Unique URL of the item.");
const SlugSchema = z
  .string()
  .describe("Unique slug for the item used to identify it in its URL.");

const ItemResultSchema = z.object({
  id: z.string(),
  url: UrlSchema,
  slug: SlugSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  thumbnail: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ItemResult = z.infer<typeof ItemResultSchema>;

export const GetItemsRequestSchema = z.object({
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
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  cursor: z.string().optional(),
});
export type GetItemsRequest = Partial<z.infer<typeof GetItemsRequestSchema>> & {
  limit?: number;
};

export const GetItemsResponseSchema = z.object({
  items: z.array(ItemResultSchema),
  nextCursor: z.string().optional(),
  total: z.number(),
});
export type GetItemsResponse = z.infer<typeof GetItemsResponseSchema>;

const ItemMetadataSchema = z
  .object({
    url: UrlSchema,
    title: z.string().optional(),
    description: z.string().optional(),
    author: z.string().optional(),
    thumbnail: z.string().url().optional(),
    publishedAt: z.string().datetime().optional(),
  })
  .strict();

export const CreateOrUpdateItemsRequestSchema = z.object({
  items: z.array(ItemMetadataSchema),
});

export type CreateOrUpdateItemsRequest = z.infer<
  typeof CreateOrUpdateItemsRequestSchema
>;

export const CreateOrUpdateItemsResponseSchema = z.object({
  items: z.array(ItemResultSchema),
  errors: z
    .array(
      z.object({
        url: z.string(),
        error: z.string(),
      }),
    )
    .optional(),
});

export type CreateOrUpdateItemsResponse = z.infer<
  typeof CreateOrUpdateItemsResponseSchema
>;
