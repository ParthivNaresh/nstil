import type { DatePickerMode } from "./types";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  ...TIME_OPTIONS,
};

const FORMAT_MAP: Record<DatePickerMode, Intl.DateTimeFormatOptions> = {
  date: DATE_OPTIONS,
  time: TIME_OPTIONS,
  datetime: DATETIME_OPTIONS,
};

export function formatDateForDisplay(date: Date, mode: DatePickerMode): string {
  return date.toLocaleString(undefined, FORMAT_MAP[mode]);
}
