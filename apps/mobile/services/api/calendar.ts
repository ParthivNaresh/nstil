import type { CalendarResponse } from "@/types";

import { apiFetch } from "./client";

const CALENDAR_PATH = "/api/v1/entries/calendar";

interface GetCalendarParams {
  readonly year: number;
  readonly month: number;
  readonly timezone: string;
  readonly journalId?: string;
}

export function getCalendar({
  year,
  month,
  timezone,
  journalId,
}: GetCalendarParams): Promise<CalendarResponse> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    timezone,
  });
  if (journalId) {
    params.set("journal_id", journalId);
  }
  return apiFetch<CalendarResponse>(`${CALENDAR_PATH}?${params.toString()}`);
}
