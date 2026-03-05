import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Card } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useCanvasSize } from "@/lib/animation";
import { withAlpha } from "@/lib/colorUtils";
import { getMoodAccentColor } from "@/lib/moodColors";
import { radius, spacing } from "@/styles";
import type { CalendarDay, MoodCategory } from "@/types";

interface YearInPixelsProps {
  readonly days: CalendarDay[];
  readonly onDayPress: (dateString: string) => void;
}

interface PixelDay {
  readonly date: string;
  readonly mood: MoodCategory | null;
  readonly hasEntries: boolean;
}

const TRAILING_WEEKS = 26;
const DAYS_IN_WEEK = 7;
const CELL_GAP = 2;
const EMPTY_OPACITY = 0.06;
const FILLED_OPACITY = 0.7;

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildTrailingGrid(days: CalendarDay[]): PixelDay[][] {
  const dayMap = new Map<string, CalendarDay>();
  for (const day of days) {
    dayMap.set(day.date, day);
  }

  const today = new Date();
  const todayDow = today.getDay();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - todayDow));

  const totalDays = TRAILING_WEEKS * DAYS_IN_WEEK;
  const startDate = new Date(endOfWeek);
  startDate.setDate(endOfWeek.getDate() - totalDays + 1);

  const grid: PixelDay[][] = [];
  let currentWeek: PixelDay[] = [];
  const cursor = new Date(startDate);

  for (let i = 0; i < totalDays; i++) {
    const dateStr = toISODate(cursor);
    const calDay = dayMap.get(dateStr);

    currentWeek.push({
      date: dateStr,
      mood: calDay?.mood_category ?? null,
      hasEntries: (calDay?.entry_count ?? 0) > 0,
    });

    if (currentWeek.length === DAYS_IN_WEEK) {
      grid.push(currentWeek);
      currentWeek = [];
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    grid.push(currentWeek);
  }

  return grid;
}

function computeMonthPositions(
  grid: PixelDay[][],
): { label: string; index: number }[] {
  const positions: { label: string; index: number }[] = [];
  let lastMonth = -1;

  for (let weekIdx = 0; weekIdx < grid.length; weekIdx++) {
    const week = grid[weekIdx];
    for (const day of week) {
      if (!day.date) continue;
      const month = new Date(day.date).getMonth();
      if (month !== lastMonth) {
        positions.push({ label: MONTH_LABELS[month], index: weekIdx });
        lastMonth = month;
      }
      break;
    }
  }

  return positions;
}

const PixelCell = memo(function PixelCell({
  day,
  size,
  emptyColor,
  onPress,
}: {
  readonly day: PixelDay;
  readonly size: number;
  readonly emptyColor: string;
  readonly onPress: (dateString: string) => void;
}) {
  const handlePress = useCallback(() => {
    if (day.date) {
      onPress(day.date);
    }
  }, [day.date, onPress]);

  const backgroundColor = day.mood
    ? withAlpha(getMoodAccentColor(day.mood), FILLED_OPACITY)
    : day.hasEntries
      ? withAlpha(emptyColor, 0.2)
      : withAlpha(emptyColor, EMPTY_OPACITY);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.cell, { width: size, height: size, backgroundColor }]}
      accessibilityLabel={day.date}
    />
  );
});

export function YearInPixels({ days, onDayPress }: YearInPixelsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { size: containerSize, onLayout } = useCanvasSize();

  const grid = useMemo(() => buildTrailingGrid(days), [days]);
  const monthPositions = useMemo(() => computeMonthPositions(grid), [grid]);

  const cellSize = containerSize.width > 0
    ? (containerSize.width - (TRAILING_WEEKS - 1) * CELL_GAP) / TRAILING_WEEKS
    : 0;

  return (
    <Card>
      <View style={styles.container} onLayout={onLayout}>
        <AppText variant="h3" color={colors.textPrimary}>
          {t("insights.yearInPixels")}
        </AppText>

        {cellSize > 0 ? (
          <View>
            <View style={styles.monthRow}>
              {Array.from({ length: TRAILING_WEEKS }, (_, i) => {
                const monthEntry = monthPositions.find((p) => p.index === i);
                return (
                  <View key={i} style={[styles.monthCell, { width: cellSize + CELL_GAP }]}>
                    {monthEntry ? (
                      <AppText variant="caption" color={colors.textTertiary}>
                        {monthEntry.label}
                      </AppText>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.grid}>
              {Array.from({ length: DAYS_IN_WEEK }, (_, rowIdx) => (
                <View key={rowIdx} style={styles.row}>
                  {grid.map((week, weekIdx) => {
                    const day = week[rowIdx];
                    if (!day) {
                      return (
                        <View
                          key={weekIdx}
                          style={[styles.cell, { width: cellSize, height: cellSize }]}
                        />
                      );
                    }
                    return (
                      <PixelCell
                        key={weekIdx}
                        day={day}
                        size={cellSize}
                        emptyColor={colors.textTertiary}
                        onPress={onDayPress}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  monthRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  monthCell: {
    alignItems: "center",
  },
  grid: {
    gap: CELL_GAP,
  },
  row: {
    flexDirection: "row",
    gap: CELL_GAP,
  },
  cell: {
    borderRadius: radius.xs,
  },
});
