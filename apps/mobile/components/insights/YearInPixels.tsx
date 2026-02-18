import { memo, useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Card } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
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

const CELL_SIZE = 14;
const CELL_GAP = 2;
const WEEKS_IN_YEAR = 53;
const DAYS_IN_WEEK = 7;
const EMPTY_OPACITY = 0.06;
const FILLED_OPACITY = 0.7;

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function buildPixelGrid(days: CalendarDay[]): PixelDay[][] {
  const dayMap = new Map<string, CalendarDay>();
  for (const day of days) {
    dayMap.set(day.date, day);
  }

  const now = new Date();
  const year = now.getFullYear();
  const startDate = new Date(year, 0, 1);
  const startDow = startDate.getDay();

  const grid: PixelDay[][] = [];
  let currentWeek: PixelDay[] = [];

  for (let i = 0; i < startDow; i++) {
    currentWeek.push({ date: "", mood: null, hasEntries: false });
  }

  const endDate = new Date(year, 11, 31);
  const current = new Date(startDate);

  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
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

    current.setDate(current.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    grid.push(currentWeek);
  }

  return grid;
}

const PixelCell = memo(function PixelCell({
  day,
  emptyColor,
  onPress,
}: {
  readonly day: PixelDay;
  readonly emptyColor: string;
  readonly onPress: (dateString: string) => void;
}) {
  const handlePress = useCallback(() => {
    if (day.date) {
      onPress(day.date);
    }
  }, [day.date, onPress]);

  if (!day.date) {
    return <View style={styles.cell} />;
  }

  const backgroundColor = day.mood
    ? withAlpha(getMoodAccentColor(day.mood), FILLED_OPACITY)
    : day.hasEntries
      ? withAlpha(emptyColor, 0.2)
      : withAlpha(emptyColor, EMPTY_OPACITY);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.cell, { backgroundColor }]}
      accessibilityLabel={day.date}
    />
  );
});

export function YearInPixels({ days, onDayPress }: YearInPixelsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const grid = useMemo(() => buildPixelGrid(days), [days]);

  const monthPositions = useMemo(() => {
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
  }, [grid]);

  return (
    <Card>
      <View style={styles.container}>
        <AppText variant="h3" color={colors.textPrimary}>
          {t("insights.yearInPixels")}
        </AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View>
            <View style={styles.monthRow}>
              {Array.from({ length: WEEKS_IN_YEAR }, (_, i) => {
                const monthEntry = monthPositions.find((p) => p.index === i);
                return (
                  <View key={i} style={styles.monthCell}>
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
                      return <View key={weekIdx} style={styles.cell} />;
                    }
                    return (
                      <PixelCell
                        key={weekIdx}
                        day={day}
                        emptyColor={colors.textTertiary}
                        onPress={onDayPress}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  scrollContent: {
    paddingRight: spacing.sm,
  },
  monthRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  monthCell: {
    width: CELL_SIZE + CELL_GAP,
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
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.xs,
  },
});
