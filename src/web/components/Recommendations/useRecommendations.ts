import { useQuery } from "@tanstack/react-query";

import { GetRecommendationsResponse } from "@/app/api/v1/items/recommended/validation";
import { createLogger } from "@/utils/logger";

const log = createLogger("Recommendations");

export const RECOMMENDATIONS_QUERY_KEY = "recommendations";

export interface RecommendationPage {
  recommendations: GetRecommendationsResponse["recommendations"];
}

interface UseRecommendationsOptions {}

export interface UseRecommendationsReturn {
  recommendations: GetRecommendationsResponse["recommendations"];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  fetchItems: (refresh?: boolean) => Promise<void>;
}

export function useRecommendations({}: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: [RECOMMENDATIONS_QUERY_KEY],
    enabled: false,
    queryFn: async () => {
      const response = await fetch(`/api/v1/items/recommended`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch recommendations: ${response.statusText}`,
        );
      }

      const data: GetRecommendationsResponse = await response.json();
      return {
        recommendations: data.recommendations,
      };
    },
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const recommendations = data?.recommendations ?? [];

  const fetchItems = async (refresh?: boolean): Promise<void> => {
    // Prevent fetching if already in progress
    if (refresh && isFetching) return;

    try {
      if (refresh) {
        await refetch();
      }
    } catch (e) {
      log.error("Error fetching recommendations:", e);
    }
  };

  return {
    recommendations,
    isLoading,
    isFetching,
    error: error as Error | null,
    fetchItems,
  };
}
