import { useFocusEffect } from "expo-router";
import { Flame, PenLine } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { AppText, Card, Icon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { withAlpha } from "@/lib/colorUtils";
import {
  countRowsBefore,
  generateMonthRange,
  getTodayRowIndex,
} from "@/lib/calendarUtils";

import { CalendarHeader } from "./CalendarHeader";
import { CalendarRow } from "./CalendarRow";
import { CalendarWeekdayRow } from "./CalendarWeekdayRow";
import { ROW_HEIGHT, SCROLL_HEIGHT, styles } from "./styles";
import type { CalendarProps } from "./types";

const PAST_MONTHS = 6;
const FUTURE_MONTHS = 1;

export function Calendar({
  dayMap,
  streak,
  totalEntries,
  selectedDate,
  onDayPress,
  headerAction,
}: CalendarProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const sections = useMemo(
    () => generateMonthRange(currentYear, currentMonth, PAST_MONTHS, FUTURE_MONTHS),
    [currentYear, currentMonth],
  );

  const allRows = useMemo(
    () => sections.flatMap((section) =>
      section.rows.map((row) => ({
        cells: row,
        monthKey: section.key,
        year: section.year,
        month: section.month,
      })),
    ),
    [sections],
  );

  const initialScrollOffset = useMemo(() => {
    const { sectionIndex, rowIndex } = getTodayRowIndex(sections);
    const totalRowsBefore = countRowsBefore(sections, sectionIndex, rowIndex);
    const visibleRows = Math.floor(SCROLL_HEIGHT / ROW_HEIGHT);
    const targetRow = Math.max(0, totalRowsBefore - (visibleRows - 1));
    return targetRow * ROW_HEIGHT;
  }, [sections]);

  const [visibleMonth, setVisibleMonth] = useState(currentMonth);
  const [visibleYear, setVisibleYear] = useState(currentYear);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: initialScrollOffset, animated: false });
      setVisibleYear(currentYear);
      setVisibleMonth(currentMonth);
    }, [initialScrollOffset, currentYear, currentMonth]),
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const middleOffset = offsetY + SCROLL_HEIGHT / 2;
      const middleRowIndex = Math.floor(middleOffset / ROW_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(middleRowIndex, allRows.length - 1));
      const row = allRows[clampedIndex];
      if (row && (row.year !== visibleYear || row.month !== visibleMonth)) {
        setVisibleYear(row.year);
        setVisibleMonth(row.month);
      }
    },
    [allRows, visibleYear, visibleMonth],
  );

  const calendarBg = withAlpha(colors.surface, 0.35);

  return (
    <Card style={[styles.container, { backgroundColor: calendarBg }]}>
      <CalendarHeader year={visibleYear} month={visibleMonth} rightAction={headerAction} />
      <CalendarWeekdayRow />

      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled
        >
          {allRows.map((row, index) => (
            <CalendarRow
              key={`${row.monthKey}-${index}`}
              cells={row.cells}
              dayMap={dayMap}
              selectedDate={selectedDate}
              onDayPress={onDayPress}
            />
          ))}
        </ScrollView>
      </View>

      {streak > 0 || totalEntries > 0 ? (
        <View style={styles.statsRow}>
          {streak > 0 ? (
            <View style={styles.statItem}>
              <Icon icon={Flame} size="xs" color={colors.accent} />
              <AppText variant="caption" color={colors.textSecondary}>
                {streak} day streak
              </AppText>
            </View>
          ) : null}
          {totalEntries > 0 ? (
            <View style={styles.statItem}>
              <Icon icon={PenLine} size="xs" color={colors.textTertiary} />
              <AppText variant="caption" color={colors.textSecondary}>
                {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
