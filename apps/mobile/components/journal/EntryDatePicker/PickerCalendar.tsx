import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import {
  buildMonthSection,
  formatDateString,
  MONTH_NAMES,
  WEEKDAY_LABELS,
} from "@/lib/calendarUtils";
import type { CalendarGridDay } from "@/lib/calendarUtils";
import { spacing } from "@/styles";

import { PickerDayCell } from "./PickerDayCell";
import type { PickerCalendarProps } from "./types";

const FIXED_ROW_COUNT = 6;

const EMPTY_CELL: CalendarGridDay = {
  date: 0,
  dateString: "",
  isCurrentMonth: false,
  isToday: false,
  isFuture: true,
  monthKey: "",
};

const EMPTY_ROW: CalendarGridDay[] = Array.from({ length: 7 }, (_, i) => ({
  ...EMPTY_CELL,
  dateString: `empty-${i}`,
}));

export const PickerCalendar = memo(function PickerCalendar({
  selectedDate,
  maximumDate,
  onDayPress,
}: PickerCalendarProps) {
  const { colors } = useTheme();

  const [year, month] = useMemo(() => {
    const parts = selectedDate.split("-");
    return [Number(parts[0]), Number(parts[1])];
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const rows = useMemo(() => {
    const section = buildMonthSection(viewYear, viewMonth);
    const padded = [...section.rows];
    while (padded.length < FIXED_ROW_COUNT) {
      padded.push(EMPTY_ROW);
    }
    return padded;
  }, [viewYear, viewMonth]);

  const todayString = useMemo(() => {
    const now = new Date();
    return formatDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const maxDateString = useMemo(() => {
    if (!maximumDate) return undefined;
    return formatDateString(
      maximumDate.getFullYear(),
      maximumDate.getMonth() + 1,
      maximumDate.getDate(),
    );
  }, [maximumDate]);

  const canGoForward = useMemo(() => {
    if (!maxDateString) return true;
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    const firstOfNext = formatDateString(nextYear, nextMonth, 1);
    return firstOfNext <= maxDateString;
  }, [viewYear, viewMonth, maxDateString]);

  const handlePrev = useCallback(() => {
    setViewMonth((m) => {
      if (m === 1) {
        setViewYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (!canGoForward) return;
    setViewMonth((m) => {
      if (m === 12) {
        setViewYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, [canGoForward]);

  const monthName = MONTH_NAMES[viewMonth - 1];

  return (
    <View style={localStyles.container}>
      <View style={localStyles.header}>
        <Pressable onPress={handlePrev} hitSlop={12}>
          <Icon icon={ChevronLeft} size="sm" color={colors.accent} />
        </Pressable>
        <View style={localStyles.headerCenter}>
          <AppText variant="label">{monthName}</AppText>
          <AppText variant="caption" color={colors.textTertiary}>
            {String(viewYear)}
          </AppText>
        </View>
        <Pressable onPress={handleNext} hitSlop={12} disabled={!canGoForward}>
          <Icon
            icon={ChevronRight}
            size="sm"
            color={canGoForward ? colors.accent : colors.textTertiary}
          />
        </Pressable>
      </View>

      <View style={localStyles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={`wd-${i}`} style={localStyles.weekdayCell}>
            <AppText variant="caption" color={colors.textTertiary}>
              {label}
            </AppText>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={localStyles.gridRow}>
          {row.map((cell) => {
            const isDisabled = cell.isFuture || (maxDateString !== undefined && cell.dateString > maxDateString);
            return (
              <PickerDayCell
                key={cell.dateString}
                date={cell.date}
                dateString={cell.dateString}
                isCurrentMonth={cell.isCurrentMonth}
                isToday={cell.dateString === todayString}
                isSelected={cell.dateString === selectedDate}
                isDisabled={isDisabled}
                onPress={onDayPress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const WEEKDAY_CELL_WIDTH = `${100 / 7}%` as const;

const localStyles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerCenter: {
    alignItems: "center",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayCell: {
    width: WEEKDAY_CELL_WIDTH,
    alignItems: "center",
    paddingBottom: spacing.xs,
  },
  gridRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
});
