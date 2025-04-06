import { useInfiniteQuery } from "@tanstack/react-query";
import { GetProfileResponse } from "@web/app/api/v1/public/profile/validation";
import { createLogger } from "@web/utils/logger";

const log = createLogger("Profile");

export const PROFILE_BATCH_SIZE = 20;
export const PROFILE_QUERY_KEY = "profile";

export interface ProfilePage {
  profile: GetProfileResponse["profile"];
  favoriteItems: GetProfileResponse["favoriteItems"];
  nextCursor?: string;
}

interface UseProfileOptions {
  username: string;
  limit?: number;
}

export interface UseProfileReturn {
  profile: GetProfileResponse["profile"] | null;
  favoriteItems: GetProfileResponse["favoriteItems"];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchItems: (refresh?: boolean) => Promise<void>;
}

export function useProfile({
  username,
  limit = PROFILE_BATCH_SIZE,
}: UseProfileOptions): UseProfileReturn {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [PROFILE_QUERY_KEY, username],
    enabled: false,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        username,
        limit: limit.toString(),
      });
      if (pageParam) {
        params.set("cursor", pageParam);
      }

      const response = await fetch(
        `/api/v1/public/profile?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data: GetProfileResponse = await response.json();
      return {
        profile: data.profile,
        favoriteItems: data.favoriteItems,
        nextCursor: data.nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const profile = data?.pages[0]?.profile ?? null;
  const favoriteItems = data?.pages.flatMap((page) => page.favoriteItems) ?? [];

  const fetchItems = async (refresh?: boolean): Promise<void> => {
    // Prevent fetching if already in progress
    if (refresh && isFetching) return;
    if (!refresh && isFetchingNextPage) return;

    try {
      if (refresh) {
        await refetch();
      } else if (hasNextPage) {
        await fetchNextPage();
      }
    } catch (e) {
      log.error("Error fetching profile:", e);
    }
  };

  return {
    profile,
    favoriteItems,
    isLoading,
    isFetching,
    error: error as Error | null,
    hasNextPage: !!hasNextPage,
    fetchItems,
    isFetchingNextPage,
  };
}
