import { z } from "zod";

export const HealthResponseSchema = z.object({
  healthy: z.boolean().describe("Health status of the service"),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
