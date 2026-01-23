import { useToast } from "@app/providers/Toast";
import { PremiumItemContextResponse } from "@app/schemas/v1/premium/item/context";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { useMutation, UseMutationResult } from "@tanstack/react-query";

const log = createLogger("current-item-actions");

export interface ExplainHighlightArgs {
  slug: string;
  snippet: string;
  versionName?: string | null;
}

interface CurrentItemActions {
  explainHighlight: UseMutationResult<
    PremiumItemContextResponse,
    Error,
    ExplainHighlightArgs
  >;
}

export function useCurrentItemActions(): CurrentItemActions {
  const { showToast } = useToast();
  const explainHighlight = useMutation<
    PremiumItemContextResponse,
    Error,
    ExplainHighlightArgs
  >({
    mutationFn: async ({ slug, snippet, versionName }) => {
      const response = await authenticatedFetch(
        "/api/v1/premium/item/context",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            snippet,
            versionName: versionName ?? null,
          }),
        },
      ).then(handleAPIResponse<PremiumItemContextResponse>);
      return response;
    },
    onError: (error) => {
      log.error("Failed to explain highlight:", error.message);
      showToast("Failed to explain highlight. Please try again.", {
        type: "error",
      });
    },
  });

  return {
    explainHighlight,
  };
}
