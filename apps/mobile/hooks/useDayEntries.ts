import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { listEntries } from "@/services/api/entries";
import type { JournalEntry, PaginatedResponse } from "@/types";

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

const DAY_ENTRIES_LIMIT = 50;

export function useDayEntries(date: string, journalId?: string) {
  const timezone = getUserTimezone();

  return useQuery<PaginatedResponse<JournalEntry>>({
    queryKey: queryKeys.entries.dayEntry(date, journalId),
    queryFn: () =>
      listEntries({
        date,
        timezone,
        limit: DAY_ENTRIES_LIMIT,
        journalId,
      }),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
