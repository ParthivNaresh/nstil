import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/queryKeys";
import { getCalendar } from "@/services/api/calendar";
import type { CalendarDay, CalendarResponse } from "@/types";

const STALE_TIME_MS = 10 * 60 * 1000;
const MONTHS_IN_YEAR = 12;

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

interface UseYearCalendarResult {
  readonly days: CalendarDay[];
  readonly isLoading: boolean;
}

export function useYearCalendar(year: number): UseYearCalendarResult {
  const timezone = getUserTimezone();

  const monthParams = useMemo(
    () => Array.from({ length: MONTHS_IN_YEAR }, (_, i) => ({
      year,
      month: i + 1,
    })),
    [year],
  );

  const queries = useQueries({
    queries: monthParams.map((p) => ({
      queryKey: queryKeys.entries.calendar(p.year, p.month),
      queryFn: () => getCalendar(p.year, p.month, timezone),
      staleTime: STALE_TIME_MS,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const days = useMemo(() => {
    const allDays: CalendarDay[] = [];
    for (const query of queries) {
      const data = query.data as CalendarResponse | undefined;
      if (data) {
        allDays.push(...data.days);
      }
    }
    return allDays;
  }, [queries]);

  return { days, isLoading };
}
