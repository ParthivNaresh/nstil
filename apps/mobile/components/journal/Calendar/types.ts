import type { CalendarDay } from "@/types";

export interface CalendarProps {
  readonly dayMap: Map<string, CalendarDay>;
  readonly streak: number;
  readonly totalEntries: number;
  readonly selectedDate?: string;
  readonly onDayPress?: (dateString: string) => void;
}
