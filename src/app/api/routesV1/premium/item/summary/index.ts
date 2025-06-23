import { summarizeItem, summarizeItemStream } from "@app/api/lib/llm";
import { LLMError } from "@app/api/lib/llm/types";
import { getItemContent, uploadItemSummary } from "@app/api/lib/storage";
import { StorageError } from "@app/api/lib/storage/types";
import {
  apiDoc,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  PremiumItemSummaryRequest,
  PremiumItemSummaryRequestSchema,
  PremiumItemSummaryResponse,
  PremiumItemSummaryResponseSchema,
} from "@app/schemas/v1/premium/item/summary";
import { Hono } from "hono";
import { streamText } from "hono/streaming";

export const summaryRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc(
      "post",
      PremiumItemSummaryRequestSchema,
      PremiumItemSummaryResponseSchema,
    ),
  ),
  zValidator(
    "json",
    PremiumItemSummaryRequestSchema,
    parseError<PremiumItemSummaryRequest, PremiumItemSummaryResponse>,
  ),
  async (c) => {
    const log = c.get("log");
    const profileId = c.get("profileId");
    const { slug, versionName } = c.req.valid("json");
    let fullContent: string | undefined;

    // Stream item summary in response if client allows
    try {
      const { content, summary } = await getItemContent(
        c.env,
        slug,
        versionName,
      );
      if (summary) {
        return c.json(PremiumItemSummaryResponseSchema.parse({ summary }));
      }

      fullContent = content;

      const accept = c.req.header("accept") || "";
      if (
        accept.includes("text/plain") ||
        accept.includes("text/event-stream")
      ) {
        c.header("Content-Encoding", "Identity");
        return streamText(c, async (stream) => {
          let summary = "";
          for await (const chunk of summarizeItemStream(c.env, fullContent!)) {
            await stream.write(chunk);
            summary += chunk;
          }
          await uploadItemSummary(c.env, slug, versionName, summary.trim());
        });
      }
    } catch (error) {
      if (error instanceof StorageError) {
        log.warn("Error fetching item content", {
          profileId,
          slug,
          versionName,
          error,
        });
        return c.json(
          {
            error: "Failed to generate summary.",
          },
          404,
        );
      }
    }
    if (!fullContent) {
      return c.json(
        {
          error: "Item content not found.",
        },
        404,
      );
    }

    // Fall back to full summary if streaming fails
    try {
      const summary = await summarizeItem(c.env, fullContent);
      await uploadItemSummary(c.env, slug, versionName, summary);
      return c.json(PremiumItemSummaryResponseSchema.parse({ summary }));
    } catch (error) {
      if (error instanceof StorageError) {
        log.error("Storage error generating summary", {
          profileId,
          slug,
          versionName,
          error,
        });
        return c.json(
          {
            error: "Failed to generate summary.",
          },
          500,
        );
      } else if (error instanceof LLMError) {
        log.error("LLM error generating summary", {
          profileId,
          slug,
          versionName,
          error,
        });
        return c.json(
          {
            error: "Failed to generate summary.",
          },
          500,
        );
      }
      log.error("Unknown error generating summary", {
        profileId,
        slug,
        versionName,
        error,
      });
      return c.json(
        {
          error: "Unknown error generating summary.",
        },
        500,
      );
    }
  },
);
