import { z } from "zod";

export const SNSWebhookResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const SNSWebhookRequestSchema = z
  .object({
    Type: z.string(),
    MessageId: z.string().optional(),
    TopicArn: z.string().optional(),
    Message: z.string(),
    Timestamp: z.string().optional(),
    SignatureVersion: z.string().optional(),
    Signature: z.string().optional(),
    SigningCertURL: z.string().optional(),
    SubscribeURL: z.string().optional(),
    Token: z.string().optional(),
  })
  .passthrough();

export type SNSWebhookRequest = z.infer<typeof SNSWebhookRequestSchema>;
export type SNSWebhookResponse = z.infer<typeof SNSWebhookResponseSchema>;
