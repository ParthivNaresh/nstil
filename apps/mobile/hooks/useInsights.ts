import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import {
  generateInsights,
  listInsights,
  updateInsight,
} from "@/services/api/insights";
import type { AIInsight, AIInsightUpdate, PaginatedResponse } from "@/types";

const STALE_TIME_MS = 5 * 60 * 1000;

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation<AIInsight[], Error>({
    mutationFn: generateInsights,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });
}

export function useInsightsList() {
  return useQuery<PaginatedResponse<AIInsight>>({
    queryKey: queryKeys.insights.lists(),
    queryFn: () => listInsights({ limit: 50 }),
    staleTime: STALE_TIME_MS,
  });
}

export function useUpdateInsight() {
  const queryClient = useQueryClient();

  return useMutation<AIInsight, Error, { id: string; data: AIInsightUpdate }>({
    mutationFn: ({ id, data }) => updateInsight(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });
}
