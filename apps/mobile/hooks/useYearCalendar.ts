import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/queryKeys";
import { getCalendar } from "@/services/api/calendar";
import type { CalendarDay, CalendarResponse } from "@/types";

const STALE_TIME_MS = 10 * 60 * 1000;
const TRAILING_MONTHS = 13;

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

interface MonthParam {
  readonly year: number;
  readonly month: number;
}

interface UseYearCalendarResult {
  readonly days: CalendarDay[];
  readonly isLoading: boolean;
}

function buildTrailingMonthParams(): MonthParam[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const params: MonthParam[] = [];
  for (let i = TRAILING_MONTHS - 1; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    params.push({ year: y, month: m });
  }
  return params;
}

export function useYearCalendar(): UseYearCalendarResult {
  const timezone = getUserTimezone();

  const monthParams = useMemo(() => buildTrailingMonthParams(), []);

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
