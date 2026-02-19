import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { isAvailable } from "@/lib/ai/foundationModels";
import { generateReflection } from "@/lib/ai/reflectionEngine";
import { queryKeys } from "@/lib/queryKeys";
import { fetchAIContext } from "@/services/api/aiContext";
import {
  createPrompt,
  getEntryReflection,
  updatePrompt,
} from "@/services/api/prompts";
import type { AIPrompt, AIPromptUpdate, JournalEntry } from "@/types";

const STALE_TIME_MS = 10 * 60 * 1000;
const MIN_BODY_LENGTH_FOR_REFLECTION = 20;

export function useEntryReflection(entryId: string) {
  const queryClient = useQueryClient();

  const {
    data: reflection,
    isLoading,
  } = useQuery<AIPrompt | null>({
    queryKey: queryKeys.prompts.reflection(entryId),
    queryFn: () => getEntryReflection(entryId, "reflection"),
    staleTime: STALE_TIME_MS,
    enabled: !!entryId,
  });

  const dismiss = useMutation<AIPrompt, Error, string>({
    mutationFn: (promptId: string) => {
      const update: AIPromptUpdate = { status: "dismissed" };
      return updatePrompt(promptId, update);
    },
    onSuccess: () => {
      queryClient.setQueryData<AIPrompt | null>(
        queryKeys.prompts.reflection(entryId),
        null,
      );
    },
  });

  const handleDismiss = useCallback(() => {
    if (reflection?.id) {
      dismiss.mutate(reflection.id);
    }
  }, [reflection?.id, dismiss]);

  return {
    reflection,
    isLoading,
    dismiss: handleDismiss,
    isDismissing: dismiss.isPending,
  };
}

export function useGenerateReflection() {
  const queryClient = useQueryClient();

  return useMutation<AIPrompt | null, Error, JournalEntry>({
    mutationFn: async (entry: JournalEntry) => {
      if (entry.body.trim().length < MIN_BODY_LENGTH_FOR_REFLECTION) {
        return null;
      }

      const onDevice = await isAvailable();
      if (!onDevice) return null;

      const existing = await getEntryReflection(entry.id, "reflection");
      if (existing) return existing;

      const context = await fetchAIContext({ entryLimit: 5, daysBack: 7 });
      const generated = await generateReflection(entry, context);

      return createPrompt({
        prompt_type: generated.promptType,
        content: generated.content,
        source: generated.source,
        mood_category: generated.moodCategory,
        entry_id: generated.entryId,
        context: generated.context,
      });
    },
    onSuccess: (result, entry) => {
      if (result) {
        queryClient.setQueryData<AIPrompt | null>(
          queryKeys.prompts.reflection(entry.id),
          result,
        );
      }
    },
  });
}
