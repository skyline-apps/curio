import { explainInContext } from "@app/api/lib/llm";
import { LLMError } from "@app/api/lib/llm/types";
import { getItemContent } from "@app/api/lib/storage";
import { StorageError } from "@app/api/lib/storage/types";
import {
  apiDoc,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  PremiumItemContextRequest,
  PremiumItemContextRequestSchema,
  PremiumItemContextResponse,
  PremiumItemContextResponseSchema,
} from "@app/schemas/v1/premium/item/context";
import { Hono } from "hono";

export const contextRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc(
      "post",
      PremiumItemContextRequestSchema,
      PremiumItemContextResponseSchema,
    ),
  ),
  zValidator(
    "json",
    PremiumItemContextRequestSchema,
    parseError<PremiumItemContextRequest, PremiumItemContextResponse>,
  ),
  async (c) => {
    const log = c.get("log");
    const profileId = c.get("profileId");
    const { slug, snippet, versionName } = c.req.valid("json");
    try {
      const { content } = await getItemContent(c.env, slug, versionName);
      const explanation = await explainInContext(c.env, snippet, content);
      return c.json(PremiumItemContextResponseSchema.parse({ explanation }));
    } catch (error) {
      if (error instanceof StorageError) {
        log.warn("Error fetching item content", {
          profileId,
          slug,
          error,
        });
        return c.json(
          {
            error: "Failed to generate context.",
          },
          404,
        );
      } else if (error instanceof LLMError) {
        log.error("LLM error generating context", {
          profileId,
          slug,
          error,
        });
        return c.json(
          {
            error: "Failed to generate context.",
          },
          500,
        );
      }
      log.error("Unknown error generating context", {
        profileId,
        slug,
        error,
      });
      return c.json(
        {
          error: "Unknown error generating context.",
        },
        500,
      );
    }
  },
);
