export interface CalendarGridDay {
  readonly date: number;
  readonly dateString: string;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isFuture: boolean;
  readonly monthKey: string;
}

export interface MonthSection {
  readonly year: number;
  readonly month: number;
  readonly key: string;
  readonly rows: CalendarGridDay[][];
}

const DAYS_IN_WEEK = 7;

export function formatDateString(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function buildMonthSection(year: number, month: number): MonthSection {
  const today = new Date();
  const todayString = formatDateString(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );

  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = startDayOfWeek + daysInMonth;
  const rowCount = Math.ceil(totalCells / DAYS_IN_WEEK);
  const gridSize = rowCount * DAYS_IN_WEEK;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

  const mk = monthKey(year, month);
  const cells: CalendarGridDay[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    const date = daysInPrevMonth - startDayOfWeek + 1 + i;
    const dateString = formatDateString(prevYear, prevMonth, date);
    cells.push({
      date,
      dateString,
      isCurrentMonth: false,
      isToday: dateString === todayString,
      isFuture: dateString > todayString,
      monthKey: mk,
    });
  }

  for (let date = 1; date <= daysInMonth; date++) {
    const dateString = formatDateString(year, month, date);
    cells.push({
      date,
      dateString,
      isCurrentMonth: true,
      isToday: dateString === todayString,
      isFuture: dateString > todayString,
      monthKey: mk,
    });
  }

  const remaining = gridSize - cells.length;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  for (let date = 1; date <= remaining; date++) {
    const dateString = formatDateString(nextYear, nextMonth, date);
    cells.push({
      date,
      dateString,
      isCurrentMonth: false,
      isToday: dateString === todayString,
      isFuture: dateString > todayString,
      monthKey: mk,
    });
  }

  const rows: CalendarGridDay[][] = [];
  for (let i = 0; i < cells.length; i += DAYS_IN_WEEK) {
    rows.push(cells.slice(i, i + DAYS_IN_WEEK));
  }

  return { year, month, key: mk, rows };
}

export function generateMonthRange(
  centerYear: number,
  centerMonth: number,
  pastMonths: number,
  futureMonths: number,
): MonthSection[] {
  const raw: MonthSection[] = [];

  for (let offset = -pastMonths; offset <= futureMonths; offset++) {
    let y = centerYear;
    let m = centerMonth + offset;
    while (m < 1) { y--; m += 12; }
    while (m > 12) { y++; m -= 12; }
    raw.push(buildMonthSection(y, m));
  }

  const sections: MonthSection[] = [];
  for (let i = 0; i < raw.length; i++) {
    const section = raw[i];
    let { rows } = section;

    if (i > 0) {
      const firstRow = rows[0];
      const hasLeadingPadding = firstRow.length > 0 && !firstRow[0].isCurrentMonth;
      if (hasLeadingPadding) {
        rows = rows.slice(1);
      }
    }

    if (i < raw.length - 1) {
      const lastRow = rows[rows.length - 1];
      const hasTrailingPadding =
        lastRow.length > 0 && !lastRow[lastRow.length - 1].isCurrentMonth;
      if (hasTrailingPadding) {
        rows = rows.slice(0, -1);
      }
    }

    sections.push({ ...section, rows });
  }

  return sections;
}

export function getTodayRowIndex(sections: MonthSection[]): { sectionIndex: number; rowIndex: number } {
  const today = new Date();
  const todayString = formatDateString(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    for (let ri = 0; ri < section.rows.length; ri++) {
      const row = section.rows[ri];
      if (row.some((cell) => cell.dateString === todayString)) {
        return { sectionIndex: si, rowIndex: ri };
      }
    }
  }

  return { sectionIndex: sections.length - 1, rowIndex: 0 };
}

export function countRowsBefore(sections: MonthSection[], sectionIndex: number, rowIndex: number): number {
  let count = 0;
  for (let i = 0; i < sectionIndex; i++) {
    count += sections[i].rows.length;
  }
  count += rowIndex;
  return count;
}

export const MONTH_NAMES: readonly string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const WEEKDAY_LABELS: readonly string[] = [
  "S", "M", "T", "W", "T", "F", "S",
] as const;

 
