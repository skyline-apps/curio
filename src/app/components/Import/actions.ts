import { useToast } from "@app/providers/Toast";
import {
  type ImportInstapaperRequest,
  type ImportInstapaperResponse,
} from "@app/schemas/v1/jobs/import/instapaper";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type UseMutationResult } from "@tanstack/react-query";

export const useTriggerInstapaperImport = (): UseMutationResult<
  ImportInstapaperResponse,
  Error,
  ImportInstapaperRequest
> => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ImportInstapaperResponse,
    Error,
    ImportInstapaperRequest
  >({
    mutationFn: async (payload: ImportInstapaperRequest) => {
      const response = await authenticatedFetch(
        "/api/v1/jobs/import/instapaper",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      return handleAPIResponse<ImportInstapaperResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importJobs"] });
      showToast("Instapaper import started successfully.", {
        disappearing: true,
      });
    },
    onError: (error) => {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to start Instapaper import.",
        { type: "error" },
      );
    },
  });

  return mutation;
};
