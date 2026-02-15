import type { CalendarResponse } from "@/types";

import { apiFetch } from "./client";

const CALENDAR_PATH = "/api/v1/entries/calendar";

export function getCalendar(
  year: number,
  month: number,
  timezone: string,
): Promise<CalendarResponse> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    timezone,
  });
  return apiFetch<CalendarResponse>(`${CALENDAR_PATH}?${params.toString()}`);
}
