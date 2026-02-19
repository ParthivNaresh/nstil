import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isAvailable } from "@/lib/ai/foundationModels";
import { generateNarrativeSummary } from "@/lib/ai/summaryEngine";
import { parseWeeklySummaryData } from "@/lib/insightUtils";
import { queryKeys } from "@/lib/queryKeys";
import { createInsight } from "@/services/api/insights";
import type { AIInsight } from "@/types";

const MIN_ENTRIES_FOR_NARRATIVE = 2;

export function useGenerateNarrativeSummary() {
  const queryClient = useQueryClient();

  return useMutation<AIInsight | null, Error, AIInsight>({
    mutationFn: async (computedSummary: AIInsight) => {
      const summaryData = parseWeeklySummaryData(computedSummary);
      if (
        !summaryData ||
        summaryData.entryCount < MIN_ENTRIES_FOR_NARRATIVE ||
        !summaryData.periodStart ||
        !summaryData.periodEnd
      ) {
        return null;
      }

      const onDevice = await isAvailable();
      if (!onDevice) return null;

      const generated = await generateNarrativeSummary(summaryData);

      return createInsight({
        insight_type: generated.insightType,
        title: generated.title,
        content: generated.content,
        source: generated.source,
        period_start: generated.periodStart,
        period_end: generated.periodEnd,
        metadata: generated.metadata,
      });
    },
    onSuccess: (result) => {
      if (result) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.insights.all,
        });
      }
    },
  });
}
