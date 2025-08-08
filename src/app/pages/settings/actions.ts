import {
  CreateApiKeyResponse,
  GetApiKeysResponse,
} from "@app/schemas/v1/user/api-keys";
import { RevokeApiKeyResponse } from "@app/schemas/v1/user/api-keys/revoke";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useCallback } from "react";

export type ApiKey = GetApiKeysResponse["keys"][0];

interface UseApiKeys {
  createApiKey: (name: string) => Promise<CreateApiKeyResponse>;
  revokeApiKey: (id: string) => Promise<RevokeApiKeyResponse>;
  listApiKeys: () => Promise<GetApiKeysResponse>;
}

export const useApiKeys = (): UseApiKeys => {
  const createApiKeyMutationOptions: UseMutationOptions<
    CreateApiKeyResponse,
    Error,
    { name: string }
  > = {
    mutationFn: async ({ name }) => {
      return await authenticatedFetch("/api/v1/user/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name,
        }),
      }).then(handleAPIResponse<CreateApiKeyResponse>);
    },
    onSuccess: () => {},
    onError: () => {},
  };

  const revokeApiKeyMutationOptions: UseMutationOptions<
    RevokeApiKeyResponse,
    Error,
    { id: string }
  > = {
    mutationFn: async ({ id }) => {
      return await authenticatedFetch(`/api/v1/user/api-keys/revoke`, {
        method: "POST",
        body: JSON.stringify({ keyId: id }),
      }).then(handleAPIResponse<RevokeApiKeyResponse>);
    },
    onSuccess: () => {},
    onError: () => {},
  };

  const createApiKeyMutation = useMutation(createApiKeyMutationOptions);
  const revokeApiKeyMutation = useMutation(revokeApiKeyMutationOptions);

  const createApiKey = useCallback(
    async (name: string): Promise<CreateApiKeyResponse> => {
      return await createApiKeyMutation.mutateAsync({ name });
    },
    [createApiKeyMutation],
  );

  const revokeApiKey = useCallback(
    async (id: string): Promise<RevokeApiKeyResponse> => {
      return await revokeApiKeyMutation.mutateAsync({ id });
    },
    [revokeApiKeyMutation],
  );

  const listApiKeys = useCallback(async (): Promise<GetApiKeysResponse> => {
    return await authenticatedFetch("/api/v1/user/api-keys").then(
      handleAPIResponse<GetApiKeysResponse>,
    );
  }, []);

  return {
    createApiKey,
    revokeApiKey,
    listApiKeys,
  };
};

interface UseDeleteAccount {
  deleteAccount: () => Promise<void>;
  isDeletingAccount: boolean;
}

export const useDeleteAccount = (): UseDeleteAccount => {
  const deleteAccountMutationOptions: UseMutationOptions<void, Error> = {
    mutationFn: async () => {
      const res = await authenticatedFetch("/api/v1/user/account", {
        method: "DELETE",
      });
      return handleAPIResponse(res);
    },
    onSuccess: () => {},
    onError: () => {},
  };

  const deleteAccountMutation = useMutation(deleteAccountMutationOptions);
  return {
    deleteAccount: () => {
      return deleteAccountMutation.mutateAsync();
    },
    isDeletingAccount: deleteAccountMutation.isPending,
  };
};
