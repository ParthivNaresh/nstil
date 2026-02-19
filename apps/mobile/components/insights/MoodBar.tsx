import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { getMoodAccentColor } from "@/lib/moodColors";
import { getMoodLabel } from "@/lib/moodUtils";
import { radius, spacing } from "@/styles";
import type { MoodCategory } from "@/types";

interface MoodBarProps {
  readonly distribution: Record<string, number>;
}

interface MoodBarEntry {
  readonly mood: string;
  readonly count: number;
  readonly ratio: number;
  readonly color: string;
  readonly label: string;
}

const MIN_BAR_WIDTH_PERCENT = 5;

export function MoodBar({ distribution }: MoodBarProps) {
  const { colors } = useTheme();

  const entries = useMemo((): MoodBarEntry[] => {
    const total = Object.values(distribution).reduce((sum, c) => sum + c, 0);
    if (total === 0) return [];

    return Object.entries(distribution)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([mood, count]) => ({
        mood,
        count,
        ratio: Math.max((count / total) * 100, MIN_BAR_WIDTH_PERCENT),
        color: getMoodAccentColor(mood as MoodCategory),
        label: getMoodLabel(mood as MoodCategory) ?? mood,
      }));
  }, [distribution]);

  if (entries.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {entries.map((entry) => (
          <View
            key={entry.mood}
            style={[
              styles.barSegment,
              {
                flex: entry.ratio,
                backgroundColor: entry.color,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {entries.map((entry) => (
          <View key={entry.mood} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: entry.color }]} />
            <AppText variant="caption" color={colors.textSecondary}>
              {entry.label} ({entry.count})
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: "row",
    height: 8,
    borderRadius: radius.xs,
    overflow: "hidden",
    gap: 2,
  },
  barSegment: {
    borderRadius: radius.xs,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
