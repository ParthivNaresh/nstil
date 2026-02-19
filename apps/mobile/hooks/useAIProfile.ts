import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { getAIProfile, updateAIProfile } from "@/services/api/aiProfile";
import type { AIProfile, AIProfileUpdate } from "@/types";

export function useAIProfile() {
  return useQuery<AIProfile>({
    queryKey: queryKeys.aiProfile.all,
    queryFn: getAIProfile,
  });
}

export function useUpdateAIProfile() {
  const queryClient = useQueryClient();

  return useMutation<AIProfile, Error, AIProfileUpdate>({
    mutationFn: updateAIProfile,
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.aiProfile.all });

      const previous = queryClient.getQueryData<AIProfile>(
        queryKeys.aiProfile.all,
      );

      if (previous) {
        queryClient.setQueryData<AIProfile>(queryKeys.aiProfile.all, {
          ...previous,
          ...update,
          updated_at: new Date().toISOString(),
        });
      }

      return { previous };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.aiProfile.all, updated);
    },
    onError: (_error, _variables, context) => {
      const ctx = context as { previous?: AIProfile } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.aiProfile.all, ctx.previous);
      }
    },
  });
}
