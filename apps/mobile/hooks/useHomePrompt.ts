import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { generatePrompt, updatePrompt } from "@/services/api/prompts";
import type { AIPrompt, AIPromptUpdate } from "@/types";

const STALE_TIME_MS = 30 * 60 * 1000;

export function useHomePrompt() {
  return useQuery<AIPrompt>({
    queryKey: queryKeys.prompts.generated(),
    queryFn: () => generatePrompt(),
    staleTime: STALE_TIME_MS,
    retry: false,
  });
}

export function useDismissPrompt() {
  const queryClient = useQueryClient();

  return useMutation<AIPrompt, Error, string>({
    mutationFn: (promptId: string) => {
      const update: AIPromptUpdate = { status: "dismissed" };
      return updatePrompt(promptId, update);
    },
    onMutate: () => {
      queryClient.setQueryData<AIPrompt | undefined>(
        queryKeys.prompts.generated(),
        undefined,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.generated(),
      });
    },
  });
}

export function useEngagePrompt() {
  return useMutation<AIPrompt, Error, string>({
    mutationFn: (promptId: string) => {
      const update: AIPromptUpdate = { status: "engaged" };
      return updatePrompt(promptId, update);
    },
  });
}
