import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { getMoodTrends } from "@/services/api/entries";
import type { MoodTrendResponse } from "@/types";

const STALE_TIME_MS = 5 * 60 * 1000;
const DEFAULT_DAYS = 7;

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function useMoodTrends(days: number = DEFAULT_DAYS) {
  const timezone = getUserTimezone();

  return useQuery<MoodTrendResponse>({
    queryKey: queryKeys.entries.moodTrends(days),
    queryFn: () => getMoodTrends(days, timezone),
    staleTime: STALE_TIME_MS,
  });
}
