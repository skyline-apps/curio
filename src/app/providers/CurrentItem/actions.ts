import { useToast } from "@app/providers/Toast";
import { PremiumItemContextResponse } from "@app/schemas/v1/premium/item/context";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { useMutation, UseMutationResult } from "@tanstack/react-query";

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
    onError: () => {
      showToast("Failed to explain highlight.", {
        type: "error",
      });
    },
  });

  return {
    explainHighlight,
  };
}
