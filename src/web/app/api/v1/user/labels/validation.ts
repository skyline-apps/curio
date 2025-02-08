import { z } from "zod";

const NameSchema = z.string().min(1).max(255);
const ColorSchema = z
  .string()
  .refine((val) => /^#?([0-9A-Fa-f]{6})$/.test(val), {
    message: "Invalid color format. Must be a 6-digit hex color code.",
  });

const LabelSchema = z.object({
  id: z.string(),
  name: NameSchema,
  color: ColorSchema,
});

export type Label = z.infer<typeof LabelSchema>;

export const GetLabelsResponseSchema = z.object({
  labels: z.array(LabelSchema),
});
export type GetLabelsResponse = z.infer<typeof GetLabelsResponseSchema>;

export const CreateOrUpdateLabelsRequestSchema = z.object({
  labels: z.array(
    z.union([
      z.object({
        id: z.string(),
        name: NameSchema.nullable().optional(),
        color: ColorSchema.nullable().optional(),
      }),
      z
        .object({
          name: NameSchema,
          color: ColorSchema,
        })
        .transform((obj) => {
          const { ...rest } = obj;
          return rest;
        }),
    ]),
  ),
});
export type CreateOrUpdateLabelsRequest = z.infer<
  typeof CreateOrUpdateLabelsRequestSchema
>;

export const CreateOrUpdateLabelsResponseSchema = z.object({
  labels: z.array(LabelSchema),
});
export type CreateOrUpdateLabelsResponse = z.infer<
  typeof CreateOrUpdateLabelsResponseSchema
>;

export const DeleteLabelsRequestSchema = z.object({
  ids: z.array(z.string()),
});
export type DeleteLabelsRequest = z.infer<typeof DeleteLabelsRequestSchema>;

export const DeleteLabelsResponseSchema = z.object({
  deleted: z.number(),
});
export type DeleteLabelsResponse = z.infer<typeof DeleteLabelsResponseSchema>;
