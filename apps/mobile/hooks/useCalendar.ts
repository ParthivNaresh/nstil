import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/queryKeys";
import { getCalendar } from "@/services/api/calendar";
import type { CalendarDay, CalendarResponse } from "@/types";

const PAST_MONTHS = 6;
const FUTURE_MONTHS = 1;
const STALE_TIME = 5 * 60 * 1000;

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

function generateMonthParams(centerYear: number, centerMonth: number): MonthParam[] {
  const params: MonthParam[] = [];
  for (let offset = -PAST_MONTHS; offset <= FUTURE_MONTHS; offset++) {
    let y = centerYear;
    let m = centerMonth + offset;
    while (m < 1) { y--; m += 12; }
    while (m > 12) { y++; m -= 12; }
    params.push({ year: y, month: m });
  }
  return params;
}

interface UseCalendarRangeResult {
  readonly dayMap: Map<string, CalendarDay>;
  readonly streak: number;
  readonly totalEntries: number;
  readonly isLoading: boolean;
}

export function useCalendarRange(): UseCalendarRangeResult {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const timezone = getUserTimezone();
  const monthParams = useMemo(
    () => generateMonthParams(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const queries = useQueries({
    queries: monthParams.map((p) => ({
      queryKey: queryKeys.entries.calendar(p.year, p.month),
      queryFn: () => getCalendar(p.year, p.month, timezone),
      staleTime: STALE_TIME,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const { dayMap, totalEntries, streak } = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    let total = 0;
    let maxStreak = 0;

    for (const query of queries) {
      const data = query.data as CalendarResponse | undefined;
      if (!data) continue;
      for (const day of data.days) {
        map.set(day.date, day);
        total += day.entry_count;
      }
      if (data.streak > maxStreak) {
        maxStreak = data.streak;
      }
    }

    return { dayMap: map, totalEntries: total, streak: maxStreak };
  }, [queries]);

  return { dayMap, streak, totalEntries, isLoading };
}
