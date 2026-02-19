import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isAvailable } from "@/lib/ai/foundationModels";
import { generateOnDevicePrompt } from "@/lib/ai/promptGenerator";
import { queryKeys } from "@/lib/queryKeys";
import { fetchAIContext } from "@/services/api/aiContext";
import { createPrompt, generatePrompt, updatePrompt } from "@/services/api/prompts";
import type { AIPrompt, AIPromptUpdate } from "@/types";

const STALE_TIME_MS = 30 * 60 * 1000;

async function generateHomePrompt(): Promise<AIPrompt> {
  const onDevice = await isAvailable();

  if (!onDevice) {
    return generatePrompt();
  }

  try {
    const context = await fetchAIContext({ entryLimit: 10, daysBack: 14 });
    const generated = await generateOnDevicePrompt(context);

    return createPrompt({
      prompt_type: generated.promptType,
      content: generated.content,
      source: generated.source,
      mood_category: generated.moodCategory,
      context: generated.context,
    });
  } catch (err) {
    console.error("[home-prompt] On-device prompt generation failed, falling back:", err);
    return generatePrompt();
  }
}

export function useHomePrompt() {
  return useQuery<AIPrompt>({
    queryKey: queryKeys.prompts.generated(),
    queryFn: generateHomePrompt,
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
